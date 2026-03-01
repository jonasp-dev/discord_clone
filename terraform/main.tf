# =============================================================================
# Discord Clone — EC2 + Docker Compose Infrastructure
# =============================================================================

# ---------------------------------------------------------------------------
# Data Sources
# ---------------------------------------------------------------------------

# Latest Amazon Linux 2023 ARM64 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# Security Group
# ---------------------------------------------------------------------------

resource "aws_security_group" "discord" {
  name        = "discord-clone-${var.environment}"
  description = "Security group for Discord clone EC2 instance"

  # HTTP from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH from allowed CIDR only
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "discord-clone-sg"
  }
}

# ---------------------------------------------------------------------------
# IAM Role — EC2 Instance Profile (for S3 backup uploads)
# ---------------------------------------------------------------------------

resource "aws_iam_role" "ec2" {
  name = "discord-clone-ec2-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_backup" {
  name = "discord-clone-s3-backup"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      }
    ]
  })
}

# SSM Session Manager access (optional — allows AWS Console → Session Manager shell access)
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "discord-clone-ec2-${var.environment}"
  role = aws_iam_role.ec2.name
}

# ---------------------------------------------------------------------------
# EC2 Instance
# ---------------------------------------------------------------------------

resource "aws_instance" "discord" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.discord.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.volume_size
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -ex

              # Install Docker
              dnf update -y
              dnf install -y docker
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ec2-user

              # Install Docker Compose plugin
              mkdir -p /usr/local/lib/docker/cli-plugins
              ARCH=$(uname -m)
              curl -SL "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-$${ARCH}" \
                -o /usr/local/lib/docker/cli-plugins/docker-compose
              chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

              # Install PostgreSQL client (for backups) and cronie (for cron jobs)
              dnf install -y postgresql15 cronie rsync
              systemctl enable crond
              systemctl start crond

              # Create app directory
              mkdir -p /opt/discord-clone
              chown ec2-user:ec2-user /opt/discord-clone
              mkdir -p /opt/discord-clone/scripts
              chown ec2-user:ec2-user /opt/discord-clone/scripts

              # Set up daily database backup cron job
              cat > /etc/cron.d/discord-backup << 'CRON'
              0 3 * * * root /opt/discord-clone/scripts/backup-db.sh >> /var/log/discord-backup.log 2>&1
              CRON
              chmod 644 /etc/cron.d/discord-backup
              EOF

  user_data_replace_on_change = true

  tags = {
    Name = "discord-clone-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# Elastic IP
# ---------------------------------------------------------------------------

resource "aws_eip" "discord" {
  instance = aws_instance.discord.id
  domain   = "vpc"

  tags = {
    Name = "discord-clone-eip"
  }
}
