pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                git 'https://github.com/sachinsharma203209-prog/accountsmate-pro.git'
            }
        }

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
