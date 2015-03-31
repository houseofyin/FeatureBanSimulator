var stages;
var rounds;
var minimumToUnblock;
var workers;
var workItemsPerWorker;
var simulations;
var totalFinished;
var totalLeadTime;
var board;
var cummulativeFlowMetrics;
var totalNumberOfItems;
var wipLimits;
var teamCollaboration;

function init()
{
	stages = parseInt($("#stages").val());
	rounds = parseInt($("#rounds").val());
	minimumToUnblock = parseInt($("#minimumToUnblock").val());
	workers = parseInt($("#workers").val());
	workItemsPerWorker = parseInt($("#workItemsPerWorker").val());	
	simulations = parseInt($("#simulations").val());
	totalNumberOfItems = workers * workItemsPerWorker;
	wipLimits = parseWipLimits($("#wipLimits").val());
	teamCollaboration  = $("#collaboation").val() === 'true';
	totalFinished = 0;
	totalLeadTime = 0.0;			
}

function parseWipLimits(userInput)
{
    var theWipLimits = [200];
    var lastComma = -1;
    var nextComma = 0;
    while (nextComma >= 0) {
    	lastComma++;
    	nextComma = userInput.indexOf(",",lastComma);
    	if (nextComma >= 0)
    	{
    		theWipLimits.push(parseInt(userInput.substring(lastComma,nextComma)));
    	}
    	else
    	{
    		theWipLimits.push(parseInt(userInput.substring(lastComma,userInput.length)));
    	}
    	lastComma = nextComma;
    	
    }
	theWipLimits.push(200);
    if (theWipLimits.length != stages)
    {
    	throw new Error("This is a mismatch between the number of stages and the number of WiP limits");
    }
    return theWipLimits;
}


function initBoard()
{
	var currentStage;
	var currentWorkItem;
	var currentRound;
	board = [];
	cummulativeFlowMetrics = [];
	for (currentRound = 0; currentRound < rounds; currentRound++)
	{
		cummulativeFlowMetrics[currentRound] = [];
	}
	for (currentStage = 0; currentStage < stages; currentStage++)
	{
		board[currentStage] = [];
	}
	for (currentWorkItem = 0; currentWorkItem < workers * workItemsPerWorker; currentWorkItem++)
	{
		board[0].push({blocked:false,
		  			      name: currentWorkItem});
	}
}

function captureCummulativeFlowMetrics(round)
{
	var currentStage;
	for (currentStage = 0; currentStage < stages; currentStage++)
	{
		cummulativeFlowMetrics[round][currentStage] = board[currentStage].length;
	}	
	
}

function displayMetrics()
{
//	var currentStage;
//	var currentRound;
//	var displayString = "";
//	for (currentRound = 0; currentRound < rounds; currentRound++)
//	{
//		checkSum = 0;
//		displayString += currentRound + ":";
//		for (currentStage = 0; currentStage < stages; currentStage++)
//		{
//			checkSum += cummulativeFlowMetrics[currentRound][currentStage];
//		    displayString += "Stage " + currentStage + ":" + cummulativeFlowMetrics[currentRound][currentStage] + " ";	
//		}
//		displayString += "<br></br>";
//	}
//	$("#metrics").html("Metrics:" + displayString);

var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var data = d3.transpose(cummulativeFlowMetrics);
data.reverse(); //So done will be on the bottom of the stack and backlog at the top

// permute the data
data = data.map(
	function(d) { 
		return d.map(function(p, i) { 
			return {x:i, y:p, y0:0}; 
		});
	});


var colors = d3.scale.category10();

var x = d3.scale.linear()
    .range([0, width])
    .domain([0,rounds-1]);

var y = d3.scale.linear()
    .range([height, 0])
    .domain([0,totalNumberOfItems]);

var z = d3.scale.category20c();

d3.selectAll("#chart *").remove();

var svg = d3.selectAll("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var stack = d3.layout.stack()
      .offset("zero")
    
var layers = stack(data);

var area = d3.svg.area()
    //.interpolate('cardinal')
    .x(function(d, i) { return x(i); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

svg.selectAll(".layer")
      .data(layers)
      .enter().append("path")
      .attr("class", "layer")
      .attr("d", function(d) { return area(d); })
      .style("fill", function(d, i) { return colors(i); });
      
// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .style("stroke", "white")
    .style("fill", "white")
    .attr("x", width/2)
    .attr("y", height-15)
    .text("Round");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .style("stroke", "white")
    .style("fill", "white")
    .attr("x", -15)
    .attr("y", width-20)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Work Items");  
    
var xScale = d3.scale.linear().domain([1, rounds]).range([0, width]),
    yScale = d3.scale.linear().domain([0, totalNumberOfItems]).range([height, 0]);    
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12),
    yAxis = d3.svg.axis().scale(yScale).orient("right");
    
  // Add the x-axis.
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the y-axis.
  svg.append("g")
      .attr("transform", "translate(" + width + ",0)")
      .call(yAxis);    


	$("#averageLeadTime").html("Average Lead Time:" + totalLeadTime/totalFinished);
	$("#averageCompleted").html("Average Completed:" + totalFinished/simulations);
}

function displayWorkItem(workItem)
{
	var displayString = "[";
	displayString += "Worker:" + workItem.worker + " ";
	displayString += "Name:" + workItem.name + " ";
	displayString += "Blocked:" + workItem.blocked + " ";
	displayString += "Started:" + workItem.started + " ";
	displayString += "Finished:" + workItem.finished + " ";
	displayString += "]<br></br>";
	return displayString;
}


function displayBoard()
{
	var currentStage;
	var currentItem;
	var displayString = "";
	for (currentStage = 0; currentStage < stages; currentStage++)
	{
		displayString += currentStage + ":";
		for (currentItem = 0; currentItem < board[currentStage].length; currentItem++)
		{
		    displayString += displayWorkItem(board[currentStage][currentItem]) + " ";	
		}
		displayString += "<br></br>";
	}
	$("#board").html("Board:" + displayString);
}

function roll()
{
	return Math.floor((Math.random() * 6)) + 1;
}

function work()
{
	var workSuccessful = false;
	var outcome = roll();
	if (outcome >= minimumToUnblock)
	{
		workSuccessful = true;
	}
	return workSuccessful;		
	
}

function startNewWorkItem(worker,round)
{
if (typeof round === "undefined")
{
	console.log("Stop here");
}

	var workDone = false;
	if (board[1].length < wipLimits[1])
	{

	     var nextWorkItem = board[0].pop();
	     if (typeof nextWorkItem === "undefined") {
	     	 throw new Error("Oops. Ran out of work to do.");
    	 }
	     nextWorkItem.worker = worker;
	     nextWorkItem.started = round;
		 board[1].push(nextWorkItem);
		 workDone = true;
	}
	return workDone;
}

function processSuccess(worker,round, helpOthers)
{
	var currentStage, currentItem;
	var workDone = false;
	//Try to unblock an item
	stageLoopForBlocks:
	for (currentStage = stages-2; currentStage >= 0; currentStage--)
	{
		for (currentItem = 0; currentItem < board[currentStage].length; currentItem++)
		{
			if ((board[currentStage][currentItem].worker === worker || helpOthers)  && 
				board[currentStage][currentItem].blocked === true)
			{
				board[currentStage][currentItem].blocked = false;
				workDone = true;
				break stageLoopForBlocks;
			}
		}
	}
	if (!workDone)
	{
		stageLoopForMoves:
		for (currentStage = stages-2; currentStage > 0; currentStage--)
		{
			for (currentItem = 0; currentItem < board[currentStage].length; currentItem++)
			{
				if (board[currentStage][currentItem].worker === worker || helpOthers)
				{
					if (board[currentStage+1].length < wipLimits[currentStage+1])
					{
						if (currentStage+2 === stages)
						{
console.log("Finished an item [" + board[currentStage][currentItem].name + "] owner:" + board[currentStage][currentItem].worker + " me:" + worker); 						
							
							board[currentStage][currentItem].finished = round;
							totalFinished++;
							totalLeadTime += board[currentStage][currentItem].finished - board[currentStage][currentItem].started;	
						}
console.log("Moved an item to [" + board[currentStage][currentItem].name + "][" + (currentStage + 1) + "] owner:" + board[currentStage][currentItem].worker + " me:" + worker); 						
console.log("Cards in target [" + board[currentStage+1].length + "] WiP Limit at Target:" + wipLimits[currentStage+1]); 						
						board[currentStage+1].push(board[currentStage][currentItem]);
						board[currentStage].splice(currentItem,1);
						workDone = true;
						break stageLoopForMoves;
					}
				}
			}
		}
	}
	if (!workDone)
	{
		workDone = startNewWorkItem(worker,round);
	}
	if (!helpOthers & !workDone)
	{
		processSuccess(worker,round, true);
	}
	
}

function processBlock(worker,round)
{
    stageLoopForBlocks:
	for (currentStage = stages-2; currentStage >= 0; currentStage--)
	{
		for (currentItem = 0; currentItem < board[currentStage].length; currentItem++)
		{
			if (board[currentStage][currentItem].worker === worker && board[currentStage][currentItem].blocked === false)
			{
				board[currentStage][currentItem].blocked = true;
				workDone = true;
				break stageLoopForBlocks;
			}
		}
	}
	startNewWorkItem(worker,round);
}


function selfishApproachToProcessingOneRound(currentRound)
{
				for (currentWorker = 0; currentWorker < workers; currentWorker++)
				{
					  if (work())
					  {
						  processSuccess(currentWorker,currentRound, false);	 
					  }
					  else
					  {
						  processBlock(currentWorker,currentRound);	          	  
					  }
				}
}



function cooperativeApproachToProcessingOneRound(currentRound)
{
	
	var successProcessor = function (currentRound) {
		return function(worker, index,array)
		{
			processSuccess(worker,currentRound, false);
		}		
    }(currentRound);
	var blockProcessor = function (currentRound) {
	return function(worker, index,array)
	{
		processBlock(worker,currentRound, false);
	}		
    }(currentRound);
	
	var blockedWorkers = [];
	var unblockedWorkers=[];
	var currentWorker;
				for (currentWorker = 0; currentWorker < workers; currentWorker++)
				{
					  if (work())
					  {
					  	  unblockedWorkers.push(currentWorker);
						  //processSuccess(currentWorker,currentRound, false);	 
					  }
					  else
					  {
					  	  blockedWorkers.push(currentWorker);
						  //processBlock(currentWorker,currentRound);	          	  
					  }
				}
				blockedWorkers.forEach(blockProcessor);
				unblockedWorkers.forEach(successProcessor);
				
}

function simulate()
{
	var currentRound;
	var currentWorker;
	try {
		init();
		for (currentSimulation = 0; currentSimulation < simulations; currentSimulation++)
		{
			initBoard();
			for (currentRound = 0; currentRound < rounds; currentRound++)
			{
				if (teamCollaboration)
				{
					cooperativeApproachToProcessingOneRound(currentRound);
				}
				else
				{
					selfishApproachToProcessingOneRound(currentRound);
				}				
				captureCummulativeFlowMetrics(currentRound);
			}
			console.log("currentSimulation:" + currentSimulation + " totalLeadTime:" + totalLeadTime);
		}
	}
	catch (e)
	{
		alert(e.message);
	}
	displayMetrics();
//	displayBoard();
}

