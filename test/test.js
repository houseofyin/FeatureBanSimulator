QUnit.module( "FeatureBan Simulator", {
  beforeEach: function() {
  	  stages = 0;
  	  rounds = 0;
  	  minimumToUnblock = 0;
  	  workers = 0;
  	  workItemsPerWorker = 0;
  	  simulations = 0;
  	  totalFinished = 0;
  	  totalLeadTime = 0;
  	  board = [];
  	  cummulativeFlowMetrics = [];
  	  totalNumberOfItems = 0;
  	  wipLimits = "";
  	  teamCollaboration = false;
  }
});

QUnit.test( "parse wip limits test typical", function( assert ) {
  stages = 4;		
  var parsedLimits = parseWipLimits("35,36");
  assert.equal( parsedLimits[1], 35);
  assert.equal( parsedLimits[2], 36);
  assert.equal( parsedLimits.length, stages);  
});

QUnit.test( "parse wip limits test no commas", function( assert ) {
  stages = 3;		
  var parsedLimits = parseWipLimits("35");
  assert.equal( parsedLimits[1], 35);
  assert.equal( parsedLimits.length, stages);  
});

QUnit.test( "parse wip limits test multiple commas", function( assert ) {
  stages = 6;		
  var parsedLimits = parseWipLimits("35,36,37,38");
  assert.equal( parsedLimits[1], 35);
  assert.equal( parsedLimits[4], 38);
  assert.equal( parsedLimits.length, stages);  
});

QUnit.test( "init board", function( assert ) {
  rounds = 4;
  workers = 5;
  workItemsPerWorker = 3;
  stages = 7;
  initBoard();
  assert.equal( board[0].length, workers * workItemsPerWorker);
  assert.equal( board[1].length, 0);
  assert.equal( board.length, stages);
  assert.equal( cummulativeFlowMetrics.length, rounds);  
});

QUnit.test( "capture cummulative flow metrics", function( assert ) {

  stages = 3;
  rounds = 2;
  board = [[1,2,3],[4,5],[6,7,8,9,10]];
  initBoard();
  captureCummulativeFlowMetrics(1);
  assert.equal( cummulativeFlowMetrics[1][0], board[0].length);
  assert.equal( cummulativeFlowMetrics[1][1], board[1].length);
  assert.equal( cummulativeFlowMetrics[1][2], board[2].length);
  assert.equal( cummulativeFlowMetrics[1].length, stages);
});

QUnit.test( "init board", function( assert ) {
  var currentTest;
  var currentResult;
  for (currentTest = 0; currentTest < 100; currentTest++)
  {
  	  currentResult = roll();
  	  assert.ok(currentResult >=1,currentResult);
  	  assert.ok(currentResult <=6,currentResult);
  }
});
		
	

