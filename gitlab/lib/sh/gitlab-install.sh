#!/bin/bash
# GitLab installation userdata script

# Update system packages
apt-get update
apt-get upgrade -y

# Install required dependencies
apt-get install -y curl openssh-server ca-certificates tzdata perl

# Add GitLab repository
curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | bash

# Install GitLab
# The EXTERNAL_URL is set to the domain configured in Route53
EXTERNAL_URL="https://gitlab.example.com" apt-get install -y gitlab-ee

# Configure and start GitLab
gitlab-ctl reconfigure

echo "GitLab installation completed"