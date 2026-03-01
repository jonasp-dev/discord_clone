variable "region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type. t4g.small (2 vCPU, 2 GB) recommended for running 4 containers."
  type        = string
  default     = "t4g.small"

  validation {
    condition     = can(regex("^t4g\\.", var.instance_type))
    error_message = "Use a t4g (ARM/Graviton) instance type to match the node:20-alpine ARM build."
  }
}

variable "key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access. Create one in AWS Console → EC2 → Key Pairs before running terraform apply."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance. Use your IP (e.g. '203.0.113.10/32'). Use '0.0.0.0/0' to allow all (not recommended)."
  type        = string

  validation {
    condition     = can(cidrhost(var.allowed_ssh_cidr, 0))
    error_message = "Must be a valid CIDR block (e.g. '203.0.113.10/32')."
  }
}

variable "volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 20
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups in S3"
  type        = number
  default     = 30
}
