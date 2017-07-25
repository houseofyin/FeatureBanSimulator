/*

    Copyright 2015 David Kane

    This file is part of FeatureBanSimulator.

    FeatureBanSimulator is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    FeatureBanSimulator is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with FeatureBanSimulator.  If not, see <http://www.gnu.org/licenses/>.

*/

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
var defaultColors;
var tunedColors;

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
        defaultColors = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];
        tunedColors = defaultColors;
}

var roll;

var currentCard = 0;
var theRandomNumbers = [];
function initRandomizer(randomizer)
{

	if (	randomizer === 'cards')
	{
		theRandomNumbers = shuffle();
		roll= fixedRandomizer;
	}	
	else if (	randomizer === 'fixed')
	{
		theRandomNumbers = [6,5,2,2,3,4,1,1,4,4,6,1,6,1,3,3,3,2,5,3,6,2,6,4,4,1,6,1,2,1,6,1,4,5,4,1,5,2,3,2,2,1,5,3,3,1,5,2,6,1,4,1];
		roll= fixedRandomizer;
	}	
	else
	{
		roll= diceRoller;
	}
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

tunedColors[stages-1] = "#ffffff";
var colors = d3.scale.ordinal()
      .domain(["0","1","2","3","4","5","6","7","8","9"])
      .range(tunedColors);

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
    .style("stroke", "black")
    .style("fill", "black")
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

var cards = [];

function shuffle()
{
	var theCards = [];
	var blackCount = 0;
	var redCount = 0;
	var currentCard;
	var currentRoll;
	for (currentCard = 0; currentCard < 52; currentCard++)
	{
		currentRoll = diceRoller();
		if (currentRoll <= 3)
		{
			if (blackCount < 26)
			{
				theCards.push(1);
				blackCount++;
			}
			else if (redCount < 26)
			{
				theCards.push(6);
				redCount++;
			}
		}
		else
		{
			if (redCount < 26)
			{
				theCards.push(6);
				redCount++;
			}
			else if (blackCount < 26)
			{
				theCards.push(1);
				blackCount++;
			}
		}
	}
	return theCards;
}

function fixedRandomizer()
{
	currentCard = (currentCard % 52);
	return theRandomNumbers[currentCard++];
}


function diceRoller()
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

	var workDone = false;
	if (board[1].length < wipLimits[1])
	{
	     var nextWorkItem = board[0].pop();
	     if (typeof nextWorkItem === "undefined") {
	     	 throw new Error("Oops. Ran out of work to do.");
    	 }
	     nextWorkItem.worker = worker;
	     nextWorkItem.started = round;
	     nextWorkItem.blocked = false;
		 board[1].push(nextWorkItem);
		 workDone = true;
	}
	return workDone;
}

function processSuccess(worker,round, helpOthers)
{
	var currentStage, currentItem;
	var workDone = processUnblock(worker, helpOthers);
	if (!workDone)
	{
		workDone = processMove(worker,round, helpOthers);
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

function processMove(worker,round, helpOthers)
{
	var workDone = false;
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
							board[currentStage][currentItem].finished = round;
							totalFinished++;
							totalLeadTime += board[currentStage][currentItem].finished - board[currentStage][currentItem].started;	
						}
						board[currentStage+1].push(board[currentStage][currentItem]);
						board[currentStage].splice(currentItem,1);
						workDone = true;
						break stageLoopForMoves;
					}
				}
			}
		}

	return workDone;
}


function processUnblock(worker, helpOthers)
{
	var workDone = false;
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
	return workDone;
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
				//workDone = true;
				break stageLoopForBlocks;
			}
		}
	}
        if (!startNewWorkItem(worker,round))
        {
             processMove(worker, round, true);
        }
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
	
	var blockedWorkers = [];
	var unblockedWorkers=[];
	var currentWorker;

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
	
	for (currentWorker = 0; currentWorker < workers; currentWorker++)
	{
		  if (work())
		  {
			  unblockedWorkers.push(currentWorker);
		  }
		  else
		  {
			  blockedWorkers.push(currentWorker);
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
		initRandomizer($("#randomizer").val());
		for (currentSimulation = 0; currentSimulation < simulations; currentSimulation++)
		{
			initBoard();
			for (currentRound = 0; currentRound < rounds; currentRound++)
			{
                                currentCard = 0;
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

