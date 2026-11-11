pipeline {
  agent { docker { image 'node:22' } }
  options { timestamps(); timeout(time: 20, unit: 'MINUTES') }
  environment { CI = 'true' }

  stages {
    stage('Install')   { steps { sh 'npm ci' } }
    stage('Typecheck') { steps { sh 'npm run typecheck' } }
    stage('API Tests') {
      parallel {
        stage('GraphQL')  { steps { sh 'npx playwright test --project=graphql' } }
        stage('SOAP')     { steps { sh 'npx playwright test --project=soap' } }
        stage('Contract') { steps { sh 'npx playwright test --project=contract' } }
      }
    }
  }
  post {
    always {
      junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
      archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
    }
  }
}
