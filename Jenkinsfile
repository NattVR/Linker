def runCommand(String command) {
    if (isUnix()) {
        sh command
    } else {
        bat command
    }
}

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    parameters {
        booleanParam(
            name: 'DEPLOY',
            defaultValue: true,
            description: 'Levantar o actualizar contenedores'
        )
    }

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        COMPOSE_PROJECT_NAME = 'linker'
        DB_HOST = credentials('DB_HOST')
        DB_USER = credentials('DB_USER')
        DB_PASSWORD = credentials('DB_PASSWORD')
        DB_DATABASE = credentials('DB_DATABASE')
        JWT_SECRET = credentials('JWT_SECRET')
        CHROME_BIN = '/usr/bin/chromium'
        DB_PORT = '5432'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Tools') {
            steps {
                script {
                    runCommand('docker --version')
                    runCommand('docker compose version')
                }
            }
        }

        stage('Validate Compose') {
            steps {
                script {
                    runCommand("docker compose -f ${env.COMPOSE_FILE} config")
                }
            }
        }
        stage('SonarQube') {
            steps {
                script {
                    dir('Backend') {
                        runCommand('npm install')
                        runCommand('npm run test:cov')
                        withSonarQubeEnv('SonarQube') {
                            runCommand('npx sonar-scanner')
                        }
                    }
                    dir('Frontend') {
                        runCommand('npm install --legacy-peer-deps')
                        runCommand('npx ng test --watch=false --code-coverage --browsers=ChromeHeadlessCI')
                        withSonarQubeEnv('SonarQube') {
                            runCommand('npx sonar-scanner')
                        }
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                script {
                    runCommand("docker compose -f ${env.COMPOSE_FILE} up -d --remove-orphans")
                }
            }
        }


        stage('Deploy') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                script {
                    runCommand("docker compose -f ${env.COMPOSE_FILE} up -d --build --remove-orphans")
                }
            }
        }

        stage('Lighthouse') {
            environment {
                FRONTEND_URL   = 'http://localhost:4200'
                LH_TEST_EMAIL    = credentials('linker-test-email')
                LH_TEST_PASSWORD = credentials('linker-test-password')
            }
            steps {
                dir('Frontend') {
                    sh '''
                        which chromium || echo "Chromium ya instalado"

                        npm ci
                        node tests/lighthouse/lighthouse-runner.js
                    '''
                }
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'Frontend/coverage/lighthouse',
                        reportFiles          : '*.html',
                        reportName           : 'Lighthouse Reports'
                    ])
                }
                failure {
                    echo 'Lighthouse: una o más rutas no alcanzan los thresholds mínimos'
                }
            }
        }

        stage('Verify') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                script {
                    runCommand("docker compose -f ${env.COMPOSE_FILE} ps")
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline ejecutado correctamente'
        }
        failure {
            echo 'El pipeline fallo. Revisa los logs en Jenkins.'
        }
        always {
            script {
                sh 'docker image prune -f || true'
            }
        }
    }
}
