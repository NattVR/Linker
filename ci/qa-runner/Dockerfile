FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    curl wget gnupg ca-certificates maven \
    chromium chromium-driver \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 \
    libnspr4 libnss3 libvulkan1 libxcomposite1 libxdamage1 \
    libxfixes3 xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
    | gpg --dearmor > /etc/apt/trusted.gpg.d/adoptium.gpg && \
    echo "deb https://packages.adoptium.net/artifactory/deb bookworm main" \
    > /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && apt-get install -y temurin-17-jdk \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /.cache/selenium /tmp/chrome-user-data /root/.m2 \
    && chmod -R 777 /.cache /tmp/chrome-user-data /root/.m2

RUN chromium --version && chromedriver --version

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER=/usr/bin/chromedriver
ENV JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-arm64
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
ENV SE_MANAGER_PATH=/usr/bin/chromedriver

WORKDIR /app