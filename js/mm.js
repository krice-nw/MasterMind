// mm.js

//"use strict";

var allow_duplicates = true;
var turns = 10;
var slots = 4;
var current_row = 1;
// these are from the css
var boardHeight = 594;
var desiredWidth = 400; // board width plus palette width plus a bit of spacee

var solution = Array;
var onDevice = false;

$("document").ready(function () {
	// try to center the game board in the center of the view ...	
	// get the view height
	var windowHeight = document.documentElement.clientHeight;
	windowHeight = window.innerHeight;
	
	// check if the default boardHeight will fit in the display
	var removeTurns = false;
	while (boardHeight > windowHeight) {
		turns -=1;
		boardHeight -= 54;
		removeTurns = true;
	}
	if (removeTurns) {
		$("#gameBoard").css("height", boardHeight);
	}
	var topEdge = (windowHeight-boardHeight)/2;
	
	// get the view width
	var windowWidth = document.documentElement.clientWidth;
	var leftEdge = (windowWidth-250)/2-20;
	// see if we have room for the palette which is 265 x 45 tall
	var showPalette = true;
	if ((desiredWidth > windowWidth) || (boardHeight < 265)) {
		showPalette = false;
		// may want to default to hide and show if we have room
		$("#palette").hide();
	} else { // use the palette so figure out the locations
		var paletteLeft = leftEdge-50+'px';
		// I want to base the palette vertical position on the bottom of board
		var paletteTop = (topEdge + boardHeight) - (265 + 54);
		if (paletteTop < topEdge) {
			paletteTop = paletteTop + 50;
		}
		paletteTop = paletteTop + 'px';
		$("#palette").css("left", paletteLeft);
		$("#palette").css("top", paletteTop);
	}
	// now set the values in pixels for drawing
	leftEdge = leftEdge+'px';
	topEdge = topEdge+'px';

	$("#gameBoard").css("left", leftEdge);
	$("#gameBoard").css("top", topEdge);

	if (isMobile.any()) {
		onDevice = true;
	} else {
		onDevice = false;
	}
	
	drawGameBoard();
	initializeGame();
});

function onDeviceReady() {
	alert("Device Ready");
	drawGameBoard();
	initializeGame();
}

function drawGameBoard() {
	// add the solution display area
	$("#gameBoard").append('<div id=empty></img>');	
	$("#gameBoard").append('<ul id=solution class=row></ul>');
	// add each turn
	for (var i=turns; i>0; i--) {	
		// add the status_area
		$("#gameBoard").append('<ul id=status_area-' + i + ' class=status_area></ul>');	
		$("#gameBoard").append('<ul id=row-' + i + ' class=row></ul>');	
		for (var j=1; j <= slots; j++) {
			$("#row-" + i).append('<li id=piece-' + i + '-' + j + ' class=piece></li>');
			// add the status list items
			$("#status_area-" + i).append('<li id=status-' + i + '-' + j + ' class=status></li>');
		}
	}
}

function initializeGame() {

	var has_solution = true;
	solution = new Array(slots);
	// see if we have a solution set
	for (var i=0; i<slots; i++) {
		var value = window.localStorage.getItem('solution-' + i);
		if (value) {
			solution[i] = value;
		} else {
			has_solution = false;
		}
	}
	if (! has_solution) {
		var randomnumber;
		// save the random number to verify uniqueness if allow_duplicates is false
		var solution_values = new Array(6);
		for (var i=0; i<slots; i++) {
			randomnumber=Math.floor(Math.random()*6)+1;
			solution_values[randomnumber] = i;	//	 could use true - might be better?
		
		if (! allow_duplicates) {
			while (solution_values[randomnumber]) {
				randomnumber=Math.floor(Math.random()*6)+1;
			}
			solution_values[randomnumber] = i;	//	 could use true - might be better?
		}
		
			var value_str;
			switch (randomnumber) {
				case 1:
					value_str = 'rgb(0, 0, 0)';
					break;
				case 2:
					value_str = 'rgb(0, 0, 255)';
					break;
				case 3:
					value_str = 'rgb(255, 255, 255)';
					break;
				case 4:
					value_str = 'rgb(255, 0, 0)';
					break;
				case 5:
					value_str = 'rgb(255, 255, 0)';
					break;
				case 6:
					value_str = 'rgb(0, 128, 0)';
					break;
			}
			if (value_str) {
				solution[i] = value_str;
				window.localStorage.setItem('solution-' + i, value_str);
			}
		}
	}
	
	// Iterate through the turn pieces to get previously saved values
	for (var i=turns; i>0; i--) {	
		for (var j=1; j <= slots; j++) {
			// let's try to read in values
			var key = 'piece-' + i + '-' + j;
			var piece_color = window.localStorage.getItem('piece-' + i + '-' + j);
			if (piece_color) {
				$("#piece-" + i + "-" + j).css("background", piece_color);
				$("#piece-" + i + "-" + j).addClass("piece_assigned");
				makePieceDraggable('piece-' + i + '-' + j);
			}
			// add the status list items
			var status_color = window.localStorage.getItem('status-' + i + '-' + j);
			if (status_color) {
				$("#status-" + i + "-" + j).css("background", status_color);
			}	
		}
	}
	
	// determine the current row Number
	var saved_row = window.localStorage.getItem("current_row");
	if (saved_row) {
		current_row = saved_row;
	} else {	// set the saved current row to the default value
		window.localStorage.setItem("current_row", current_row);
	}
	$("#row-" + current_row).addClass("current");

	// see if the game is over
	if(window.localStorage.getItem('gameover')) {
		$("li").draggable('disable');
		// show the solution
		showSolution();
		updateNewGameButton(true);
		return;
	} else {
		updateNewGameButton(false);
	}
	
	// add the click handler to the ul pieces on the current li
	assignClickHandler(true); 

	// if not over continue with the board setup
	if (saved_row) {
		// need to make all earlier rows complete
		for (var i=saved_row-1; i > 0; i--) {
			$("#row-" + i).addClass("complete");		
		}
		// This next method will make the current row status area the submit button if needed
		updateSubmitButton();
	}
	
	$("li.piece").droppable({	
   		drop: function(event, ui) {			
			// set the background of the dropped element to the background of the dragged element
			if ($(ui.draggable).data("color")) {
				$(this).css("background", $(ui.draggable).data("color"));
			}	
			
			// try to save to local storage
			window.localStorage.setItem($(this).attr("id"), $(ui.draggable).data("color"));	

			// if the dragged piece was from the current row but the dropped piece isn't 
			// in the current row make sure the submit button is disabled
			if ($(ui.draggable).data("current")) {
				if (! $(this).parent().hasClass("current")) {
					updateSubmitButton();
				}
			}
			
			// if the dragged piece is not from a complete row clear the localStorage color
			// BUG - we are removing the storage for completed pieces when dragging to empty pieces
//			if (! $(ui.draggable).data("complete")) {
			if (! $(ui.draggable).parent().hasClass("complete")) {
				window.localStorage.removeItem($(ui.draggable).attr("id"));	
			}

			// make the position draggable
			makePieceDraggable($(this).attr('id'))
   		}
	});

	// for each completed piece disable droppable
	// I need this for the read in values and it has to be after the
	// general li.piece droppable declaration
	$("ul.complete li.piece").droppable('disable');

	$("ul.palette li").draggable({
		helper: 'clone',
		cursor: 'pointer',
		start: function(e,ui){
			// save the background information to apply to the dropped item
			$(this).data("color", $(this).css("background-color"));
			// make sure the dragging object is on top
			$(ui.helper).css("z-index",100);
  		},
  		stop: function(e,ui){
  		}
  	});
	
	// add a drop observer to check if the current row is full
	// need to disable the submit button when the user moves out a piece
	// binding to all li.piece or #gameBoard ul
	$("li.piece").bind( "drop", function(event, ui) {
		// assign the set class
		$(this).addClass("piece_assigned");
		updateSubmitButton();
	});	
}

/*
	Method to determine if the state of the submit button
*/
function updateSubmitButton() {
	var row_full = true;
	$("ul.current li").each(function() {
		// should probably utilze a style for the li being set
		if (! $(this).hasClass("piece_assigned")) {
			row_full = false;
		}
	});
	if (row_full) {
		// show it in the status area of the current row
		$("#submit_guess").removeAttr("disabled");
		assignSubmitClickHandler(false);	// remove prior to add to ensure only one instance is bound
		assignSubmitClickHandler(true);
		// try hiding the list items
		$("#status_area-" + current_row).find("li").hide();
		$("#status_area-" + current_row).addClass("submit_button");
	} else {
		assignSubmitClickHandler(false);
		// show the list items
		$("#status_area-" + current_row).find("li").show();
		$("#status_area-" + current_row).removeClass("submit_button");
	}
}

/*
	Method to make the piece draggable.  This is called when restoring the board from
	localStorage and when an empty piece has a piece dropped onto it
*/
function makePieceDraggable(piece_id) {
	// make the position draggable
	$('#' + piece_id).draggable('enable');
	$('#' + piece_id).draggable({
		helper: "clone",
		cursor: 'pointer',
		revert: function(dropObj) {
			if (dropObj === false) {
				// put the piece back so reset color and dragability
				$(this).css("background-color", $(this).data("color"));
				$(this).draggable('enable');
				if (! $(this).parent().hasClass("complete")) {
					$(this).addClass("piece_assigned");
				}
			}
			return false;
		},
		start: function(e, ui) {
			// make sure the dragging object is on top
			$(ui.helper).css("z-index",100);
			// save the color
			$(this).data("color", $(this).css("background-color"));
			// need to check if the piece dragged from is in a complete row prior to removing 
			// the background 
			if (! $(this).parent().hasClass("complete")) {
				// reset the background to empty
				$(this).css("background", "");
				// and disable dragging from this piece
				$(this).draggable('disable');
				
				// this shoukld remove the class when ever a drag begin but ...
				// feature isn't woriking as expected. test around revert and piece_assignment class
				$(this).removeClass("piece_assigned");
			}
			// use data values so drop can determine if a drag was from a piece in the current row
			if ($(this).parent().hasClass("current")) {
				$(this).data("current", $(this).parent().hasClass("current"));
			}
		},
		stop: function(e, ui) {
			// nothing to do here	
		}
	});
}

function assignSubmitClickHandler(add) {
//	alert("assignSubmitClickHandler: " + add);
	if (add) {
		// add the click handler
		//alert("Add submit click handler for staus in the current row");
		if (onDevice) {
			$("#status_area-" + current_row).bind("tapone", clickSubmit); 
		} else {
			$("#status_area-" + current_row).bind("click", clickSubmit); 
		}
	} else {
		// remove the click handler
		//alert("Remove submit click handler for staus in the current row");
		if (onDevice) {
			$("#status_area-" + current_row).unbind("tapone");
		} else {
			$("#status_area-" + current_row).unbind("click");
		}
	}
}

function clickSubmit() {
	//alert("clickSubmit");
	
	// remove the click handler
	//alert('Submitted');
	$("#submit_guess").attr("disabled", "disabled");
	// make all the pieces not droppable
	$("ul.current li.piece").droppable('disable');

	// evaluate the current row to the solution
	var count = 0;
	var black = 0;
	var white = 0;
	
	// maybe loop through the solution pieces ...
	var answer = new Array(slots);
	for (var i=0; i<slots; i++) {
		answer[i] = solution[i];
	}
	
	var guess = new Array(slots);
	$("ul.current li").each(function() {
		guess[count] = $(this).css("background-color");
		count++;
	});		
	
	// find the exact matches
	for (var i=0; i<slots; i++) {
		if (guess[i] == answer[i]) {
//				alert("Found an exact match!");
			black++;
			answer[i] = undefined;
			guess[i] = undefined;
		}
	}
	
	// find any remaining color matches 
	var count = 0;
	for (var i=0; i<slots; i++) {
		for (var j=0; j<slots; j++) {
			if (answer[i] && guess[j]) {
				if (guess[j] == answer[i]) {
//						alert("Found a color match!");
					white++
					answer[i] = undefined;
					guess[j] = undefined;
				}
			}
		}
	}

	// update the status
	count = 0;
	for (var i=1; i<=black; i++) {
		$("#status-" + current_row + '-' + i).css("background", "black");
		window.localStorage.setItem('status-' + current_row + '-' + i, "black");
	}
	for (var i=black+1; i<=black+white; i++) {
		$("#status-" + current_row + '-' + i).css("background", "white");
		window.localStorage.setItem('status-' + current_row + '-' + i, "white");
	}

	// Remove the submit button click handler 
	assignSubmitClickHandler(false);
	$("#status_area-" + current_row).removeClass("submit_button");
	// show the list items
	$("#status_area-" + current_row).find("li").show();
	
	// see if the game is over
	if (black == slots) {
//		alert("Game Over!");
		endGame();
	} else if (current_row >= turns) {
		alert("Max turns hit - end game");
		endGame();
	} else {	
		// remove the click handler to the current current row
		assignClickHandler(false); 
		
		// make this a complete and not current row
		$("ul.current").addClass("complete").removeClass("current");
		current_row++;
					
		window.localStorage.setItem("current_row", current_row);
		$("#row-" + current_row).addClass("current");
		
		// remove the click handler to the current current row
		assignClickHandler(true); 

		// need to check if the new current row has all piece assigned colors and thus enable submit
		updateSubmitButton();
	}
}

function assignClickHandler(add) {
	var spot = 0;
	$("ul.current li").each(function() {
		spot++;
		var value = $(this).css("background-color");
		if (add) {
			if (onDevice) {
				$(this).bind("tapone", togglePiece); 
			} else {
				$(this).bind("click", {spot: spot}, togglePiece); 
			}
		} else {
			// remove the click handler
			if (onDevice) {
				$(this).unbind("tapone");
			} else {
				$(this).unbind("click");
			}
		}
	});
}

function togglePiece(piece) {
	var value = $(this).css("background-color");
	var setItem = true;
	
	if (value == 'rgb(0, 0, 0)') {
		$(this).css("background-color", 'rgb(0, 0, 255)');
	} else if (value == 'rgb(0, 0, 255)') {
		$(this).css("background-color", 'rgb(255, 255, 255)');
	} else if (value == 'rgb(255, 255, 255)') {
		$(this).css("background-color", 'rgb(255, 0, 0)');
	} else if (value == 'rgb(255, 0, 0)') {
		$(this).css("background-color", 'rgb(255, 255, 0)');
	} else if (value == 'rgb(255, 255, 0)') {
		$(this).css("background-color", 'rgb(0, 128, 0)');
	} else if (value == 'rgb(0, 128, 0)') {
		$(this).css("background-color", '#ccc'); // 'rgb(238, 238, 238)');
		// this is the default background and this means we need to disable draggable
		$(this).draggable('disable');
		$(this).removeClass("piece_assigned");
		setItem = false;
	} else {
		$(this).css("background-color", 'rgb(0, 0, 0)');
		// this should only be called when toggling from the empty scenario so make draggable
		makePieceDraggable($(this).attr("id"));
		$(this).addClass("piece_assigned");
	}
	if (setItem) {
		window.localStorage.setItem($(this).attr("id"), $(this).css("background-color"));
	} else {
		window.localStorage.removeItem($(this).attr("id"));	
	}
	
	// still need to handle the submit button status ...
	updateSubmitButton();
}

function endGame() {
	// really want to only disable draggable game turn pieces, not all li items which include the palette options
	$(".piece").draggable('disable');
	$(".piece").droppable('disable');
	//$("li").draggable('disable');
	
	// remove the click handler to the current current row
	assignClickHandler(false); 
	// remove submit click handler to the current row

	// add data to show the game is over
	window.localStorage.setItem('gameover', 'true');
	
	// show the solution in the solution area
	showSolution();
	// put a replay button in the solution status area
	updateNewGameButton(true);
	
	// vibrate the device
	if (onDevice) {
		navigator.notification.vibrate(1000);
	}
}

/*
	Method to determine the state of the new game button
*/
function updateNewGameButton(gameOver) {
	if (gameOver) {
		// show it in the empty area left of the solution
		assignNewGameClickHandler(false);	// remove prior to add to ensure only one instance is bound
		assignNewGameClickHandler(true);
		$("#empty").addClass("new_game_button");
	} else {
		assignNewGameClickHandler(false);
		$("#empty").removeClass("new_game_button");
	}
}

function assignNewGameClickHandler(add) {
//	alert("assignNewGameClickHandler: " + add);
	if (add) {
		// add the clickNewGame handler
		if (onDevice) {
			$("#empty").bind("tapone", newGame); 
		} else {
			$("#empty").bind("click", newGame); 
		}
	} else {
		// remove the click handler
		if (onDevice) {
			$("#empty").unbind("tapone");
		} else {
			$("#empty").unbind("click");
		}
	}
}

function newGame() {
	// clear the local storage and re-initialize the game;
	assignClickHandler(false); 
	clearLocalStorage();
	
	// may need to call this for all current and completed pices; makePieceDraggable(piece_id)
	$("li.piece").draggable('disable').droppable('enable').removeClass("piece_assigned").css("background-color", '#ccc');
	$("li.status").css("background-color", '#ccc');
	$("ul.row").removeClass("current").removeClass("complete");
	current_row = 1;
	
	// this bit of code should only be for the submit button referenced in the html, not the status area as submit
	// need to disable submit and remove the click handler as we will add it again at initialize
	$("#submit_guess").attr("disabled", "disabled");
	$("#submit_guess").unbind("click");
	
	// reset the new game
	// remove the solution pieces and initialize a new game 
	$("#solution").empty();
	initializeGame();
}

function showSolution() {
	for (var i=1; i <= slots; i++) {
		$("#solution").append('<li id=solution_piece-' + i + ' class=piece></li>');
		$("#solution_piece-" + i).css("background", solution[i-1]);
	}
}

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

function clearLocalStorage() {
	for (var i=0; i<slots; i++) {
		window.localStorage.removeItem('solution-' + i);
	}

	// Iterate through the turn pieces to remove previously saved values
	for (var i=turns; i>0; i--) {	
		for (var j=1; j <= slots; j++) {
			window.localStorage.removeItem('piece-' + i + '-' + j);
			window.localStorage.removeItem('status-' + i + '-' + j);
		}
	}

	window.localStorage.removeItem("current_row");
	window.localStorage.removeItem('gameover');
}

/*
window.onload = load_page;

function load_page() {
	// see if I can get the dimensions of the webview
//	alert("load page");
	
//	alert(window);
//	alert(window.width);
	
	var width=window.innerWidth;
	var height=window.innerHeight;
	
	getOnlineState();
	
	if (useSampleData) {
		init_store();
	}
}
*/

