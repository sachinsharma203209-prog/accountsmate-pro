pipeline {
    agent any

    stages {

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

       stage('Deploy to Nginx') {
    steps {
        sh '''
        rm -rf /usr/share/nginx/html/*
        cp -r dist/* /usr/share/nginx/html/
        '''
    }
}

    }
}
