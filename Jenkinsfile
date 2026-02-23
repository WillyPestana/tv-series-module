pipeline {
  agent any

  options {
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('CI') {
      steps {
        sh './scripts/ci.sh'
      }
    }
  }
}
