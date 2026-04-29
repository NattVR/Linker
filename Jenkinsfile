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
        booleanParam(name: 'RUN_UNIT_TESTS',   defaultValue: true, description: 'Ejecutar unit tests (Jest + Karma)')
        booleanParam(name: 'RUN_SONAR',        defaultValue: true, description: 'Ejecutar analisis SonarQube')
        booleanParam(name: 'RUN_REGRESSION_FRONTEND',   defaultValue: true, description: 'Ejecutar pruebas de regresion front (Angular/Karma)')
        booleanParam(name: 'RUN_API_SECURITY_BACKEND',          defaultValue: true, description: 'Ejecutar pruebas API (Supertest)')
        booleanParam(name: 'RUN_PERFORMANCE',  defaultValue: true, description: 'Ejecutar pruebas de performance (k6)')
        booleanParam(name: 'RUN_REGRESSION_BACKEND',   defaultValue: true, description: 'Ejecutar pruebas de regresion backend (Supertest)')
        booleanParam(name: 'RUN_LIGHTHOUSE',   defaultValue: true, description: 'Ejecutar performance web (Lighthouse)')
        booleanParam(name: 'RUN_SECURITY_FRONTEND',     defaultValue: true, description: 'Ejecutar pruebas de seguridad (Cypress)')
        booleanParam(name: 'DEPLOY',           defaultValue: true, description: 'Levantar contenedores de prueba')
        choice(name: 'PERF_PROFILE',           choices: ['quick', 'smoke', 'load'], description: 'Perfil k6')
    }

    // Los environments
    environment {
        COMPOSE_FILE         = 'docker-compose.yml'
        COMPOSE_TEST_FILE    = 'docker-compose.test.yml'
        COMPOSE_PROJECT_NAME = 'linker'
        DB_HOST              = credentials('DB_HOST')
        DB_USER              = credentials('DB_USER')
        DB_PASSWORD          = credentials('DB_PASSWORD')
        DB_DATABASE          = credentials('DB_DATABASE')
        JWT_SECRET           = credentials('JWT_SECRET')
        CHROME_BIN           = '/usr/bin/chromium'
        PUPPETEER_SKIP_DOWNLOAD          = 'true'
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true'
        DB_PORT              = '5432'
    }

    //Validaciones de herramientas y archivos de configuración
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
                    runCommand('node --version')
                    runCommand('npm --version')
                }
            }
        }

        stage('Validate Compose') {
            steps {
                script {
                    runCommand("docker compose -f ${env.COMPOSE_FILE} config")
                    runCommand("docker compose -f ${env.COMPOSE_TEST_FILE} config")
                }
            }
        }

        //intalar dependencias
        stage('Install Dependencies') {
            steps {
                script {
                    dir('Backend') {
                        runCommand('npm install')
                    }
                    dir('Frontend') {
                        runCommand('npm install --legacy-peer-deps')
                    }
                }
            }
        }

        //Unit tests
        stage('Unit Tests') {
            when {
                expression { params.RUN_UNIT_TESTS }
            }
            steps {
                script {
                    dir('Backend') {
                        runCommand('npm run test:cov')
                    }
                    dir('Frontend') {
                        runCommand('npx ng test --watch=false --code-coverage --browsers=ChromeHeadlessCI')
                    }
                }
            }
        }
        //Sonar scanner
        stage('SonarQube') {
            when{
                expression {params.RUN_SONAR}
            }
            steps {
                script {
                    dir('Backend') {
                    //runCommand('npm install')
                    //runCommand('npm run test:cov')
                        withSonarQubeEnv('SonarQube') {
                            runCommand('npx sonar-scanner')
                        }
                    }
                    dir('Frontend') {
                        //runCommand('npm install --legacy-peer-deps')
                        //runCommand('npx ng test --watch=false --code-coverage --browsers=ChromeHeadlessCI')
                        withSonarQubeEnv('SonarQube') {
                            runCommand('npx sonar-scanner')
                        }
                    }
                }
            }
        }

        //regression front
        stage('Regression Frontend Test') {
            when {
                expression { params.RUN_REGRESSION_FRONTEND }
            }
            steps {
                script {
                    dir('Frontend') {
                        runCommand('npm run test:regression')
                    }
                }
            }
        }

        stage('Deploy Test Environment') {
            when {
                expression {
                    params.DEPLOY && (
                        params.RUN_PERFORMANCE ||
                        params.RUN_REGRESSION_BACKEND ||
                        params.RUN_LIGHTHOUSE||
                        params.RUN_API_SECURITY_BACKEND
                    )
                }
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
                        docker compose -f docker-compose.test.yml down --remove-orphans --timeout 30 || true
                        docker rm -f linker-backend-1 linker-frontend-1 2>/dev/null || true
                        docker network rm linker_default 2>/dev/null || true

                        fuser -k 3001/tcp 2>/dev/null || true
                        fuser -k 4201/tcp 2>/dev/null || true

                        docker network prune -f || true
                        sleep 5
                    '''
                    runCommand("docker compose -f ${env.COMPOSE_TEST_FILE} up -d --build --remove-orphans")
                }
            }
        }

        // verificar que esten levantados 
        stage('Wait For Services') {
            when {
                expression {
                    params.DEPLOY && (
                        params.RUN_PERFORMANCE ||
                        params.RUN_REGRESSION_BACKEND ||
                        params.RUN_LIGHTHOUSE||
                        params.RUN_API_SECURITY_BACKEND
                    )
                }
            }
            steps {
                sh '''
                    echo "Esperando backend..."
                    for i in $(seq 1 40); do
                        code=$(curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:3001 || true)
                        if [ "$code" != "000" ]; then
                            echo "Backend disponible (HTTP $code)"
                            break
                        fi
                        echo "Intento $i/40..."
                        sleep 3
                    done

                    echo "Esperando frontend..."
                    for i in $(seq 1 40); do
                        code=$(curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:4201 || true)
                        if [ "$code" != "000" ]; then
                            echo "Frontend disponible (HTTP $code)"
                            break
                        fi
                        echo "Intento $i/40..."
                        sleep 3
                    done
                '''
            }
        }
        
        // pruebas de performance back con k6
        stage('Performance Tests Backend') {
            when {
                expression { params.RUN_PERFORMANCE && params.DEPLOY }
            }
            environment {
                BACKEND_URL = 'http://host.docker.internal:3001'
            }
           steps {
            sh '''
                if ls Backend/test/performance/*.k6.js >/dev/null 2>&1; then
                    perf_dir="Backend/test/performance"
                    perf_glob="${perf_dir}/*.k6.js"
                elif ls Linker/Backend/test/performance/*.k6.js >/dev/null 2>&1; then
                    perf_dir="Linker/Backend/test/performance"
                    perf_glob="${perf_dir}/*.k6.js"
                else
                    echo "No se encontraron suites k6 en Backend/test/performance"
                    exit 1
                fi

                failed=0
                for script in $perf_glob; do
                    suite="$(basename "$script" .k6.js)"
                    echo "Ejecutando suite k6: ${suite} (perfil: ${PERF_PROFILE})"
                    suite_failed=0

                    cid="$(docker create \
                        --add-host=host.docker.internal:host-gateway \
                        -e BASE_URL=${BACKEND_URL} \
                        -e PERF_PROFILE=${PERF_PROFILE} \
                        grafana/k6:0.57.0 \
                        run "/tests/${suite}.k6.js")" || suite_failed=1

                    if [ "$suite_failed" -eq 0 ]; then
                        docker cp "${perf_dir}/." "${cid}:/tests" || suite_failed=1
                    fi

                    if [ "$suite_failed" -eq 0 ]; then
                        docker start -a "${cid}" || suite_failed=1
                    fi

                    if [ -n "${cid}" ]; then
                        docker rm -f "${cid}" >/dev/null 2>&1 || true
                    fi

                    [ "$suite_failed" -ne 0 ] && failed=1
                done

                exit $failed
            '''
        }
        }

        //pruenas de regresion back con supertest
        stage('Regression Backend Test') {
            when {
                expression { params.RUN_REGRESSION_BACKEND && params.DEPLOY }
            }
            environment {
                DB_HOST     = credentials('DB_HOST_TEST')
                DB_USER     = credentials('DB_USER_TEST')
                DB_PASSWORD = credentials('DB_PASSWORD_TEST')
                DB_DATABASE = credentials('DB_DATABASE_TEST')
                DB_PORT     = '5432'
            }
            steps {
                dir('Backend') {
                    sh 'npm run test:regresion'
                }
            }
        }


        stage('API & Security Tests Backend') {
            when {
                expression { params.RUN_API_SECURITY_BACKEND && params.DEPLOY }
            }
            environment {
                DB_HOST     = credentials('DB_HOST_TEST')
                DB_USER     = credentials('DB_USER_TEST')
                DB_PASSWORD = credentials('DB_PASSWORD_TEST')
                DB_DATABASE = credentials('DB_DATABASE_TEST')
                DB_PORT     = '5432'
                }
            steps {
                dir('Backend') {
                    sh 'npx jest --runInBand --config ./test/jest-e2e.json'
                }
            }
        }
        //lighthouse

        stage('Lighthouse') {
            when {
                expression { params.RUN_LIGHTHOUSE && params.DEPLOY }
            }
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
        // } Falta regression front y back , performance back , seguridad front con cyoress

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
