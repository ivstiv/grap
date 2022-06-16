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

containerIp=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' grap-backend)

if [ -z "$1" ]; then
  echo "Please specify recipient email."
  exit 1
fi

{
    sleep 1; \
    echo "EHLO server.example.test"; \
    sleep 1; \
    echo "MAIL FROM: <test@example.test>"; \
    sleep 1; \
    echo "RCPT TO: <$1>"; \
    sleep 1; \
    echo "DATA"; \
    sleep 1; \
    echo "Subject: Testing email"; \
    sleep 1; \
    echo "From: Test Script <test@example.test>"; \
    sleep 1; \
    echo "To: $1"; \
    sleep 1; \
    echo "Html: <div dir=\"ltr\"><h1>Hello World from Gmail</h1><p>Lorem ipsum dolor sit amet!</p></div>"; \
    sleep 1; \
    echo "Text: Hello, this is my testing email."; \
    sleep 1; \
    echo "TextAsHtml: <p>Hello, this is my testing email.</p>"; \
    sleep 1; \
    echo "."; \
    sleep 1; \
    echo "QUIT"; \
} | telnet "$containerIp" 25