#!/bin/sh

checkDependencies() {
  mainShellPID="$$"
  printf "telnet\ndocker\ncurl\n" | while IFS= read -r program; do
    if ! [ -x "$(command -v "$program")" ]; then
      echo "Error: $program is not installed." >&2
      kill -9 "$mainShellPID" 
    fi
  done
}

checkDependencies

if ! curl -s --unix-socket /var/run/docker.sock http/_ping > /dev/null 2>&1
then
  echo "Error: Docker service is not running."
  exit 1
fi

containerIp=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' email-proj-backend)

{
    sleep 1; \
    echo "EHLO server.example.com"; \
    sleep 1; \
    echo "MAIL FROM: <test@test.com>"; \
    sleep 1; \
    echo "RCPT TO: <test@test.com>"; \
    sleep 1; \
    echo "DATA"; \
    sleep 1; \
    echo "Subject: Testing email"; \
    sleep 1; \
    echo "From: Test Script <testingscript@fakemail.test>"; \
    sleep 1; \
    echo "To: generatedemail@fakemail2.test"; \
    sleep 1; \
    echo "."; \
    sleep 1; \
    echo "QUIT"; \
} | telnet "$containerIp" 25