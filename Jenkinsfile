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
        COMPOSE_FILE         = 'docker-compose.yml'
        COMPOSE_PROJECT_NAME = 'linker'
        DB_HOST              = credentials('DB_HOST')
        DB_USER              = credentials('DB_USER')
        DB_PASSWORD          = credentials('DB_PASSWORD')
        DB_DATABASE          = credentials('DB_DATABASE')
        JWT_SECRET           = credentials('JWT_SECRET')
        CHROME_BIN           = '/usr/bin/chromium'
        DB_PORT              = '5432'
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
                        runCommand('npm install --legacy-peer-deps ')
                        runCommand('npx ng test --watch=false --code-coverage --browsers=ChromeHeadlessCI')
                        withSonarQubeEnv('SonarQube') {
                            runCommand('npx sonar-scanner')
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { params.DEPLOY }
            }
            environment {
                DB_HOST_TEST     = credentials('DB_HOST_TEST')
                DB_USER_TEST     = credentials('DB_USER_TEST')
                DB_PASSWORD_TEST = credentials('DB_PASSWORD_TEST')
                DB_DATABASE_TEST = credentials('DB_DATABASE_TEST')
            }
            steps {
                script {
                    sh '''
                        docker compose -f docker-compose.yml down --remove-orphans --timeout 30 || true
                        docker rm -f linker-backend-1 linker-frontend-1 2>/dev/null || true
                        docker network rm linker_default 2>/dev/null || true

                        fuser -k 3001/tcp 2>/dev/null || true
                        fuser -k 4201/tcp 2>/dev/null || true

                        docker network prune -f || true
                        sleep 5
                    '''
                    runCommand("docker compose -f ${env.COMPOSE_FILE} -f docker-compose.test.yml up -d --build --remove-orphans")
                }
            }
        }

        stage('Check Frontend') {
            steps {
                sh '''
                    echo "Esperando a que el frontend esté disponible..."
                    for i in {1..20}; do
                        if curl -s http://host.docker.internal:4201 > /dev/null; then
                            echo "Frontend listo"
                            break
                        fi
                        echo "Intento $i..."
                        sleep 3
                    done

                    echo "=== Contenido de config.json en el contenedor ==="
                    docker exec linker-frontend-1 cat /usr/share/nginx/html/assets/config.json

                    echo "=== config.json accesible desde el host ==="
                    curl -s http://host.docker.internal:4201/assets/config.json
                '''
            }
        }

        stage('Lighthouse') {
            environment {
                FRONTEND_URL     = 'http://host.docker.internal:4201'
                BACKEND_URL      = 'http://host.docker.internal:3001'
                LH_TEST_EMAIL    = credentials('linker-test-email')
                LH_TEST_PASSWORD = credentials('linker-test-password')
            }
            steps {
                dir('Frontend') {
                    sh '''
                        which chromium || echo "Chromium ya instalado"
                        npm ci --legacy-peer-deps
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

        // stage('Cypress') {
        //     when {
        //         expression { params.DEPLOY }
        //     }
        //     environment {
        //         FRONTEND_URL     = 'http://host.docker.internal:4201'
        //         BACKEND_URL      = 'http://host.docker.internal:3001'
        //         CYPRESS_TEST_EMAIL    = credentials('linker-test-email')
        //         CYPRESS_TEST_PASSWORD = credentials('linker-test-password')
        //     }
        //     agent {
        //         docker {
        //             image 'cypress/included:15.14.1'
        //         }
        //     }
        //     steps {
        //         dir('Frontend') {
        //             sh '''
        //                 npx cypress run \
        //                 --browser chromium \
        //                 --headless \
        //                 --env FRONTEND_URL=$FRONTEND_URL,API_URL=$BACKEND_URL,TEST_EMAIL=$CYPRESS_TEST_EMAIL,TEST_PASSWORD=$CYPRESS_TEST_PASSWORD \
        //                 --config baseUrl=$FRONTEND_URL \
        //                 --reporter spec
        //             '''
        //         }
        //     }
        //     post {
        //         always {
        //             publishHTML(target: [
        //                 allowMissing         : true,
        //                 alwaysLinkToLastBuild: true,
        //                 keepAll              : true,
        //                 reportDir            : 'Frontend/coverage/cypress/screenshots',
        //                 reportFiles          : '**/*.png',
        //                 reportName           : 'Cypress Screenshots'
        //             ])
        //         }
        //         failure {
        //             echo 'Cypress: una o más pruebas E2E fallaron'
        //         }
        //     }
        // }

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