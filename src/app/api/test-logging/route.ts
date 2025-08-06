import { NextRequest, NextResponse } from 'next/server';
import { withAPILogging, logDatabaseOperation, logExternalAPI } from '@/lib/api-middleware';

/**
 * Test API route to demonstrate and verify the logging implementation
 * This route simulates various logging scenarios:
 * - Request logging
 * - Database operation logging
 * - External API logging
 * - Error handling with logging
 */
export const GET = withAPILogging<any>(async (request, context) => {
  const url = new URL(request.url);
  const scenario = url.searchParams.get('scenario') || 'success';

  context.logger.info('Test logging endpoint called', {
    'test.scenario': scenario,
    'test.query_params': url.search,
  });

  // Simulate different scenarios based on query parameter
  switch (scenario) {
    case 'database':
      // Test database operation logging
      const dbLogger = logDatabaseOperation(context, 'select', 'test_table', {
        'test.operation': 'simulated_db_query',
      });

      dbLogger.info('Simulating database query');
      
      // Simulate database operation delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      dbLogger.info('Database query completed', {
        'result.count': 42,
        'query.duration_ms': 100,
      });

      return NextResponse.json({
        message: 'Database logging test completed',
        scenario,
        duration: Date.now() - context.startTime,
      });

    case 'external_api':
      // Test external API logging
      const extLogger = logExternalAPI(context, 'test-service', '/api/v1/test', {
        'test.operation': 'simulated_api_call',
      });

      extLogger.info('Simulating external API call');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      extLogger.info('External API call completed', {
        'response.status': 200,
        'response.duration_ms': 150,
      });

      return NextResponse.json({
        message: 'External API logging test completed',
        scenario,
        duration: Date.now() - context.startTime,
      });

    case 'error':
      // Test error logging
      context.logger.warn('About to simulate an error for testing');
      
      throw new Error('This is a test error to verify error logging');

    case 'complex':
      // Test complex logging with multiple operations
      context.logger.info('Starting complex operation test');

      const complexDbLogger = logDatabaseOperation(context, 'transaction', 'multiple_tables');
      complexDbLogger.info('Starting complex database transaction');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const complexExtLogger = logExternalAPI(context, 'auth-service', '/verify');
      complexExtLogger.info('Calling authentication service');
      
      await new Promise(resolve => setTimeout(resolve, 75));
      
      complexExtLogger.info('Authentication verified');
      complexDbLogger.info('Transaction completed successfully');

      context.logger.info('Complex operation completed', {
        'operations.database': true,
        'operations.external_api': true,
        'operations.total_duration_ms': Date.now() - context.startTime,
      });

      return NextResponse.json({
        message: 'Complex logging test completed',
        scenario,
        operations: ['database', 'external_api'],
        duration: Date.now() - context.startTime,
      });

    default:
      // Basic success scenario
      context.logger.info('Basic success scenario executed');
      
      return NextResponse.json({
        message: 'Basic logging test completed',
        scenario,
        timestamp: new Date().toISOString(),
        duration: Date.now() - context.startTime,
      });
  }
}, { operation: 'test_logging' });

export const POST = withAPILogging<any>(async (request, context) => {
  const body = await request.json().catch(() => ({}));
  
  context.logger.info('POST test logging endpoint called', {
    'request.body_keys': Object.keys(body).join(','),
    'request.has_test_data': 'testData' in body,
  });

  // Simulate processing the posted data
  if (body.testData) {
    const dbLogger = logDatabaseOperation(context, 'insert', 'test_logs', {
      'data.size': JSON.stringify(body.testData).length,
    });

    dbLogger.info('Processing test data submission');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    dbLogger.info('Test data processed successfully', {
      'result.id': 'test-' + Date.now(),
    });
  }

  return NextResponse.json({
    message: 'POST logging test completed',
    received: body,
    duration: Date.now() - context.startTime,
  });
}, { operation: 'test_logging_post' });