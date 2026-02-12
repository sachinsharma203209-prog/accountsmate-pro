pipeline {
    agent any

    stages {
        

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Restart App') {
            steps {
                sh 'pm2 restart all || pm2 start server.js'
            }
        }
    }
}
