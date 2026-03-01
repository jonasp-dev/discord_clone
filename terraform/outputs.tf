# =============================================================================
# Outputs
# =============================================================================

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.discord.id
}

output "public_ip" {
  description = "Elastic IP address of the Discord clone server"
  value       = aws_eip.discord.public_ip
}

output "app_url" {
  description = "URL to access the Discord clone application"
  value       = "http://${aws_eip.discord.public_ip}"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i <your-key>.pem ec2-user@${aws_eip.discord.public_ip}"
}

output "backup_bucket" {
  description = "S3 bucket name for database backups"
  value       = aws_s3_bucket.backups.id
}

output "ami_id" {
  description = "AMI used for the EC2 instance"
  value       = data.aws_ami.amazon_linux.id
}

output "next_steps" {
  description = "Steps to complete deployment"
  value       = <<-EOT

    ========================================
    Deployment Next Steps
    ========================================
    1. Update discord_backend/.env.prod:
       - Set CORS_ORIGIN=http://${aws_eip.discord.public_ip}
       - Generate secrets: openssl rand -base64 48

    2. Run the deploy script:
       ./scripts/deploy.sh ${aws_eip.discord.public_ip} <path-to-key>.pem

    3. Verify:
       curl http://${aws_eip.discord.public_ip}/health
       Open http://${aws_eip.discord.public_ip} in browser

  EOT
}
