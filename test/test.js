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
  initRandomizer();
  for (currentTest = 0; currentTest < 100; currentTest++)
  {
  	  currentResult = roll();
  	  assert.ok(currentResult >=1,currentResult);
  	  assert.ok(currentResult <=6,currentResult);
  }
});

var fixedRoller = function(rollResult) {
	return function()
	{   
		return rollResult;
	}
	}

QUnit.test( "work", function( assert ) {
  minimumToUnblock = 4;
  roll = fixedRoller(3);
  assert.ok(!work());
  roll = fixedRoller(1);
  assert.ok(!work());
  roll = fixedRoller(4);
  assert.ok(work());
  roll = fixedRoller(6);
  assert.ok(work());
  minimumToUnblock = 2;
  roll = fixedRoller(1);
  assert.ok(!work());
  roll = fixedRoller(2);
  assert.ok(work());
});

QUnit.test( "start new work item", function( assert ) {
 board = [[{},{},{}],[]];
 wipLimits = [35,1];
 var workDone = startNewWorkItem("A",2);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 1);
 assert.equal( board[1][0].worker, "A");
 assert.equal( board[1][0].started, 2);
 assert.ok(workDone);
 workDone = startNewWorkItem("B",3);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 1);
 assert.equal( board[1][0].worker, "A");
 assert.equal( board[1][0].started, 2);
 assert.ok(!workDone);
});

QUnit.test( "processSuccess", function( assert ) {
 stages = 4;
 wipLimits = [35,1,1,35];
 board = [[{},{},{}],[],[],[]];
 processSuccess("C",1,false);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 0);
 assert.equal( board[1][0].started, 1);
 
 workDone = processSuccess("B",1,false);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 0);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 0);
 
 workDone = processSuccess("B",2,true);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 0);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1);
 assert.equal( board[3][0].finished, 2);
 assert.equal( board[3][0].started, 1);
 assert.ok(!board[3][0].blocked);
 
 processBlock("C",2);
 assert.equal( board[0].length, 1);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1);
 assert.equal( board[1][0].started, 2);

 processBlock("C",3);
 
 workDone = processSuccess("B",3,false);
 assert.equal( board[0].length, 1);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1);
 
 processBlock("B",4);
 assert.equal( board[0].length, 1);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1);
 
 workDone = processSuccess("C",4,false);
 assert.equal( board[0].length, 1);
 assert.equal( board[1].length, 0);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 1);
 
 workDone = processSuccess("A",5,false);
 assert.equal( board[0].length, 0);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 1);
 
 workDone = processSuccess("A",5,true);
 assert.equal( board[0].length, 0);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 2);
 assert.equal( board[3][1].finished, 5);
 assert.equal( board[3][1].started, 2);
 
 assert.ok(!board[3][0].blocked);
 assert.ok(!board[3][1].blocked);
 
});

QUnit.test( "processMove", function( assert ) {
 stages = 4;
 wipLimits = [35,1,1,35];
 board = [[{}],[{worker: "A", blocked:false}], 
              [{worker: "B", blocked:true}],[]];
 var workDone = processMove("C",2,false);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 0);
 assert.ok(!workDone);
 
 workDone = processMove("A",2,false);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 0);
 assert.ok(!workDone);

 workDone = processUnblock("C",true);
 workDone = processMove("B",2,false);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1);
 assert.equal( board[3][0].finished, 2);
 
 assert.ok(workDone);
 
 workDone = processMove("B",2,true);
 assert.equal( board[1].length, 0);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 1);
 assert.ok(workDone); 

 
});	

QUnit.test( "processUnblock", function( assert ) {
 stages = 3;
 board = [[{}],[{worker: "A", blocked:false}, 
              {worker: "A", blocked:true}, 
 			  {worker: "B", blocked:true}],[]];
 var workDone = processUnblock("C",false);
 assert.equal( board[1][0].blocked, false);
 assert.equal( board[1][1].blocked, true);
 assert.equal( board[1][2].blocked, true);
 assert.ok(!workDone);
 
 workDone = processUnblock("A",false);
 assert.equal( board[1][0].blocked, false);
 assert.equal( board[1][1].blocked, false);
 assert.equal( board[1][2].blocked, true);
 assert.ok(workDone);

 workDone = processUnblock("C",true);
 assert.equal( board[1][0].blocked, false);
 assert.equal( board[1][1].blocked, false);
 assert.equal( board[1][2].blocked, false);
 assert.ok(workDone);

 
});	

QUnit.test( "processBlock", function( assert ) {
 stages = 3;
 board = [[{}],[{worker: "A", blocked:false}, 
              {worker: "A", blocked:true}, 
 			  {worker: "B", blocked:true}],[]];
 processBlock("C",2);
 assert.equal( board[1][0].blocked, false);
 assert.equal( board[1][1].blocked, true);
 assert.equal( board[1][2].blocked, true);

 processBlock("A",2);
 assert.equal( board[1][0].blocked, true);
 assert.equal( board[1][1].blocked, true);
 assert.equal( board[1][2].blocked, true);

});	

var rollCount = 0;

var fixedRangedRoller = function(rollResults) {
	return function()
	{   
		return rollResults[rollCount++];
	}
	}

QUnit.test( "processSelfishApproach", function( assert ) {
 stages = 4;
 workers = 2;
 minimumToUnblock = 4;
 board = [[{},{},{},{}],[],[],[]];
 wipLimits = [35,1,1,35];
 
 roll = fixedRangedRoller([6,6,6,1,6,1]);
 selfishApproachToProcessingOneRound(1);
 assert.equal( board[0].length, 3);
 assert.equal( board[1].length, 0);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 0);
 
 selfishApproachToProcessingOneRound(2);
 assert.equal( board[0].length, 2);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 0);
 assert.equal( board[3].length, 1); 

 selfishApproachToProcessingOneRound(3);
 assert.equal( board[0].length, 1);
 assert.equal( board[1].length, 1);
 assert.equal( board[2].length, 1);
 assert.equal( board[3].length, 1); 
 assert.equal( board[2][0].blocked, true);

});	


QUnit.test( "shuffle", function( assert ) {

  var shuffledCards = shuffle();
  var oneCount = 0;
  var sixCount = 0;
  var currentCard = 0;
  assert.equal( shuffledCards.length, 52); 
  for (currentCard = 0; currentCard < 52; currentCard++)
  {
  	  if (shuffledCards[currentCard] === 1)
  	  {
  	  	  oneCount++;
  	  }
  	  else
  	  {
  	  	  sixCount++;
  	  }
  }
  assert.equal( oneCount, 26); 
  assert.equal( sixCount, 26); 

});	

QUnit.test( "testFixedRandomizer", function( assert ) {

   var i;
   var theRandomNumbersToTest = [];
   for (i = 0; i < 52; i++)
   {
   	   theRandomNumbersToTest.push(fixedRandomizer());
   }   
   for (i = 0; i < 52; i++)
   {
   	    assert.equal( theRandomNumbers[i], theRandomNumbersToTest[i]); 
   }
		
});

QUnit.test( "testCardRandomizer", function( assert ) {

  var shuffledCards = shuffle();
  var oneCount = 0;
  var sixCount = 0;
  var currentCard = 0;

   var i;
   var theRandomNumbersToTest = [];
   cards = shuffle();
   for (i = 0; i < 52; i++)
   {
   	   theRandomNumbersToTest.push(cardRandomizer());
   }   
  for (currentCard = 0; currentCard < 52; currentCard++)
  {
  	  if (theRandomNumbersToTest[currentCard] === 1)
  	  {
  	  	  oneCount++;
  	  }
  	  else
  	  {
  	  	  sixCount++;
  	  }
  }
  assert.equal( oneCount, 26); 
  assert.equal( sixCount, 26); 

});	

 
//TODO Test Selfish v Cooperative

	

