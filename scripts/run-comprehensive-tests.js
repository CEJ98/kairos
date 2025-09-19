#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Kairos Fitness Application
 * Runs all test suites, generates reports, and provides summary
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Starting Comprehensive Test Suite for Kairos Fitness')
console.log('=' .repeat(60))

const testResults = {
  unit: { passed: 0, failed: 0, total: 0, duration: 0 },
  integration: { passed: 0, failed: 0, total: 0, duration: 0 },
  security: { passed: 0, failed: 0, total: 0, duration: 0 },
  e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
  coverage: { lines: 0, functions: 0, branches: 0, statements: 0 }
}

function runCommand(command, description) {
  console.log(`\n📋 ${description}`)
  console.log('-'.repeat(40))
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    })
    
    console.log('✅ Success')
    return { success: true, output }
  } catch (error) {
    console.log('❌ Failed')
    console.log(error.stdout || error.message)
    return { success: false, error: error.stdout || error.message }
  }
}

function parseTestResults(output, testType) {
  try {
    // Parse vitest output format
    const passedMatch = output.match(/(\d+) passed/i)
    const failedMatch = output.match(/(\d+) failed/i)
    const totalMatch = output.match(/Tests\s+\d+\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/i) ||
                      output.match(/Tests\s+(\d+)\s+passed/i)
    const durationMatch = output.match(/Duration\s+([\d.]+)([ms]+)/i)
    
    if (passedMatch) testResults[testType].passed = parseInt(passedMatch[1])
    if (failedMatch) testResults[testType].failed = parseInt(failedMatch[1])
    if (totalMatch) testResults[testType].total = parseInt(totalMatch[2] || totalMatch[1])
    if (durationMatch) {
      const duration = parseFloat(durationMatch[1])
      const unit = durationMatch[2]
      testResults[testType].duration = unit === 's' ? duration * 1000 : duration
    }
  } catch (error) {
    console.warn(`Could not parse ${testType} test results:`, error.message)
  }
}

function parseCoverageResults(output) {
  try {
    // Parse coverage percentages
    const linesMatch = output.match(/Lines\s+:\s+([\d.]+)%/i)
    const functionsMatch = output.match(/Functions\s+:\s+([\d.]+)%/i)
    const branchesMatch = output.match(/Branches\s+:\s+([\d.]+)%/i)
    const statementsMatch = output.match(/Statements\s+:\s+([\d.]+)%/i)
    
    if (linesMatch) testResults.coverage.lines = parseFloat(linesMatch[1])
    if (functionsMatch) testResults.coverage.functions = parseFloat(functionsMatch[1])
    if (branchesMatch) testResults.coverage.branches = parseFloat(branchesMatch[1])
    if (statementsMatch) testResults.coverage.statements = parseFloat(statementsMatch[1])
  } catch (error) {
    console.warn('Could not parse coverage results:', error.message)
  }
}

async function runTestSuite() {
  const startTime = Date.now()
  
  // 1. Run Unit Tests
  console.log('\n🔬 Running Unit Tests')
  const unitResult = runCommand('npm run test:unit', 'Unit Tests')
  if (unitResult.success) {
    parseTestResults(unitResult.output, 'unit')
  }
  
  // 2. Run Integration Tests  
  console.log('\n🔗 Running Integration Tests')
  const integrationResult = runCommand('npm run test:integration', 'Integration Tests')
  if (integrationResult.success) {
    parseTestResults(integrationResult.output, 'integration')
  }
  
  // 3. Run Security Tests
  console.log('\n🛡️ Running Security Tests')
  const securityResult = runCommand('npm run test:security', 'Security Tests')
  if (securityResult.success) {
    parseTestResults(securityResult.output, 'security')
  }
  
  // 4. Generate Coverage Report
  console.log('\n📊 Generating Coverage Report')
  const coverageResult = runCommand('npm run test:coverage', 'Coverage Analysis')
  if (coverageResult.success) {
    parseCoverageResults(coverageResult.output)
  }
  
  // 5. Run E2E Tests (if available)
  console.log('\n🌐 Running E2E Tests')
  const e2eResult = runCommand('npm run test:e2e', 'End-to-End Tests')
  if (e2eResult.success) {
    parseTestResults(e2eResult.output, 'e2e')
  }
  
  // 6. Type Checking
  console.log('\n📝 Running Type Check')
  const typeCheckResult = runCommand('npm run type-check', 'TypeScript Type Checking')
  
  // 7. Linting
  console.log('\n🧹 Running Linter')
  const lintResult = runCommand('npm run lint', 'ESLint Analysis')
  
  const endTime = Date.now()
  const totalDuration = endTime - startTime
  
  // Generate comprehensive report
  generateTestReport(totalDuration)
}

function generateTestReport(totalDuration) {
  console.log('\n' + '='.repeat(60))
  console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  
  const totalTests = Object.values(testResults).reduce((sum, result) => {
    return sum + (result.total || 0)
  }, 0)
  
  const totalPassed = Object.values(testResults).reduce((sum, result) => {
    return sum + (result.passed || 0)
  }, 0)
  
  const totalFailed = Object.values(testResults).reduce((sum, result) => {
    return sum + (result.failed || 0)
  }, 0)
  
  // Test Results Summary
  console.log('\n📊 Test Execution Summary:')
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   ✅ Passed: ${totalPassed}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`)
  console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  
  // Detailed Breakdown
  console.log('\n📋 Detailed Breakdown:')
  Object.entries(testResults).forEach(([testType, results]) => {
    if (testType === 'coverage') return
    
    const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0
    console.log(`   ${testType.toUpperCase().padEnd(12)} | ${results.passed}/${results.total} passed (${successRate}%) | ${results.duration.toFixed(0)}ms`)
  })
  
  // Coverage Report
  console.log('\n📈 Coverage Report:')
  console.log(`   Lines:      ${testResults.coverage.lines.toFixed(1)}%`)
  console.log(`   Functions:  ${testResults.coverage.functions.toFixed(1)}%`)
  console.log(`   Branches:   ${testResults.coverage.branches.toFixed(1)}%`)
  console.log(`   Statements: ${testResults.coverage.statements.toFixed(1)}%`)
  
  // Quality Assessment
  console.log('\n🎯 Quality Assessment:')
  
  const coverageScore = (
    testResults.coverage.lines +
    testResults.coverage.functions +
    testResults.coverage.branches +
    testResults.coverage.statements
  ) / 4
  
  const testSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
  
  console.log(`   Test Success Rate: ${getQualityGrade(testSuccessRate)} (${testSuccessRate.toFixed(1)}%)`)
  console.log(`   Coverage Score:    ${getQualityGrade(coverageScore)} (${coverageScore.toFixed(1)}%)`)
  
  if (coverageScore >= 90 && testSuccessRate >= 95) {
    console.log('\n🏆 EXCELLENT! Your application has comprehensive test coverage and high reliability.')
  } else if (coverageScore >= 80 && testSuccessRate >= 90) {
    console.log('\n✅ GOOD! Your application has solid test coverage. Consider improving edge case testing.')
  } else if (coverageScore >= 70 && testSuccessRate >= 85) {
    console.log('\n⚠️  FAIR! Your application needs improved test coverage and reliability.')
  } else {
    console.log('\n❌ NEEDS IMPROVEMENT! Consider adding more comprehensive tests.')
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:')
  
  if (testResults.coverage.branches < 85) {
    console.log('   • Add more branch coverage tests for conditional logic')
  }
  
  if (testResults.coverage.lines < 85) {
    console.log('   • Increase line coverage by testing more code paths')
  }
  
  if (totalFailed > 0) {
    console.log('   • Fix failing tests to improve reliability')
  }
  
  if (testResults.integration.total === 0) {
    console.log('   • Add integration tests for API endpoints')
  }
  
  if (testResults.e2e.total === 0) {
    console.log('   • Add end-to-end tests for critical user journeys')
  }
  
  // Generate detailed report file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: testSuccessRate,
      duration: totalDuration
    },
    breakdown: testResults,
    recommendations: generateRecommendations()
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../test-reports/comprehensive-test-report.json'),
    JSON.stringify(reportData, null, 2)
  )
  
  console.log('\n📁 Detailed report saved to: test-reports/comprehensive-test-report.json')
  console.log('='.repeat(60))
}

function getQualityGrade(percentage) {
  if (percentage >= 95) return '🏆 EXCELLENT'
  if (percentage >= 90) return '🥇 VERY GOOD'
  if (percentage >= 80) return '🥈 GOOD'
  if (percentage >= 70) return '🥉 FAIR'
  if (percentage >= 60) return '⚠️  POOR'
  return '❌ CRITICAL'
}

function generateRecommendations() {
  const recommendations = []
  
  if (testResults.coverage.lines < 85) {
    recommendations.push('Increase line coverage by adding tests for untested code paths')
  }
  
  if (testResults.coverage.branches < 85) {
    recommendations.push('Add more conditional logic tests to improve branch coverage')
  }
  
  if (testResults.unit.failed > 0) {
    recommendations.push('Fix failing unit tests to ensure component reliability')
  }
  
  if (testResults.integration.failed > 0) {
    recommendations.push('Fix failing integration tests to ensure API reliability')
  }
  
  if (testResults.security.total === 0) {
    recommendations.push('Add security tests to validate authentication and authorization')
  }
  
  return recommendations
}

// Ensure test-reports directory exists
const reportsDir = path.join(__dirname, '../test-reports')
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true })
}

// Run the test suite
runTestSuite().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})