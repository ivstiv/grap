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
    printf "Received: by mail-ej1-f54.example.test with SMTP id u12so17211350eja.8\r\n"; \
    sleep 1; \
    printf "DKIM-Signature: something invalid\r\n"; \
    sleep 1; \
    printf "X-Google-DKIM-Signature: something invalid\r\n"; \
    sleep 1; \
    printf "X-Gm-Message-State: something invalid\r\n"; \
    sleep 1; \
    printf "X-Google-Smtp-Source: something invalid\r\n"; \
    sleep 1; \
    printf "X-Received: something invalid\r\n"; \
    sleep 1; \
    printf "MIME-Version: 1.0\r\n"; \
    sleep 1; \
    printf "From: Test Script <test@example.test>\r\n"; \
    sleep 1; \
    printf "Subject: Testing email\r\n"; \
    sleep 1; \
    printf "To: $1\r\n"; \
    sleep 1; \
    printf 'Content-Type: multipart/alternative; boundary="000000000000e412ae05e1d12662"\r\n'; \
    sleep 1; \
    printf "\r\n"; \
    sleep 1; \
    printf " --000000000000e412ae05e1d12662\r\n"; \
    sleep 1; \
    printf "Content-Type: text/plain; charset='UTF-8'\r\n"; \
    sleep 1; \
    printf "\r\n"; \
    sleep 1; \
    printf "Email content here!\r\n"; \
    sleep 1; \
    printf "\r\n"; \
    sleep 1; \
    printf " --000000000000e412ae05e1d12662\r\n"; \
    sleep 1; \
    printf "Content-Type: text/html; charset='UTF-8'\r\n"; \
    sleep 1; \
    printf "\r\n"; \
    sleep 1; \
    printf '<div dir="ltr">Email content here!<br></div>\r\n'; \
    sleep 1; \
    printf "\r\n"; \
    sleep 1; \
    printf " --000000000000e412ae05e1d12662--\r\n"; \
    sleep 1; \
    echo "."; \
    sleep 1; \
    echo "QUIT"; \
} | telnet "$containerIp" 25