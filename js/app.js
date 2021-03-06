$(document).ready(function () {

    // Local copy of data from Database to keep page load times down
    var league_array = [];
    var results_array = [];
    var sched;

    //hide team limit alert upon load
    $('.alert').hide();

    // Function to make table sort dynamic
    $('#mytable').tablesorter();

    //===========================================================
    //                ** PAGELOAD CALL **
    //===========================================================

    pageLoad(); //Functions to be loaded on page loads.

    //===========================================================
    //                ** END PAGELOAD CALL **
    //===========================================================

    //===========================================================
    //                 ** PAGE LOAD FUNCTIONS **
    //===========================================================

    function pageLoad() {

        var data_retrieved = 0;

        $.ajax({ //grabs results
            type: 'GET',
            url: '/backliftapp/results',
            success: function (data) {
                results_array.push(data);
                data_retrieved++; //following is for functions that need both results and league arrays
                if (data_retrieved == 2) { //(see above)
                    initializePage(); //(see above)
                }; //(see above)
            }
        });

        $.ajax({ //grabs teams
            type: 'GET',
            url: '/backliftapp/team',
            success: function (data) {
                league_array.push(data);
                printTeam(data); // populates table on load
                data_retrieved++; //following is for functions that need both results and league arrays
                if (data_retrieved == 2) { //(see above)
                    initializePage(); //(see above)
                }; //(see above)
                enterScoresPop(); //populates enter scores modal
                sortTable(); // loads and triggers tablesorter on an empty table
            }
        }); //end print standings/schedule call  

        function initializePage() { //functions that require both league_array and results_array to be populated
            scheduleWrite(); //populates scoreboard/schedule  
            buttonColor(); //changes start season button color based on league size
            weekPop(); //populates weeks menu in enter scores modal
        }

        $.ajax({ //checks to see if season has started
            type: 'GET',
            url: '/backliftapp/start',
            success: function (data) {
                if (data[0].trigger === "and so it begins") {
                    $('<h4>This season is LIVE!</h4>').appendTo('#bigolhead');
                    $('body').addClass('nix_is_hidden');
                    $('#create_team_button').hide();
                    $('#start_season_button').hide();
                    $('#enter_scores_button').show();
                    $('#reset_season_button').show();
                }
            }
        }); //end start season call 
    };

    //===========================================================
    //             ** END PAGE LOAD FUNCTIONS **
    //===========================================================

    //===========================================================
    //                ** MAX TEAM LIMIT FUNCTION **
    //===========================================================

    $('#create_team').on('show', function (e) {
        if (league_array[0].length === 8) {
            $('.alert').show();
            return e.preventDefault();
        };
    }); // end max team limit function

    //===========================================================
    //                ** END MAX TEAM LIMIT FUNCTION **
    //===========================================================

    //===========================================================
    //                ** CREATE TEAM CLICK EVENT **
    //===========================================================

    $('#createTeam').click(function () {
        if ($("#modal_form").valid() == true) {
        //if team deleted from middle of field, id's stop corresponding to league_array.length. fix!
        var team = {
            //id: idWrite(), IGNORE -- NONFUNCTIONAL CODE
            id: league_array[0].length + 1,
            teamName: $('#teamName').val(),
            firstName: $('#mgr_fname').val(),
            lastName: $('#mgr_lname').val(),
            phoneNumber: $('#phoneNumber').val(),
            sponsor: $('#sponsor').val(),
            zip: "37" + $('#zip').val(),
            wins: 0,
            losses: 0
        };

        lineWrite(); //adds single row on form submit

        $.ajax({
            url: "/backliftapp/team",
            type: "POST",
            dataType: "json",
            data: team,
            success: function () {
                league_array[0].push(team); //pushes new team to league_array
                scheduleCall(); //dynamically changes schedule on add/rm team
                buttonColor(); //changes start season button color based on league size
            }
        });
        $('#create_team').modal('hide'); //hide modal on submit
        clearForm(); //clear form inputs	
        validateClear(); //clears validate status on form submit
        sortTable(); //loads sort table on empty table
        } else {
            $.preventDefault();
        }   				    
    }); //end submit click function	

    //===========================================================
    //              ** END CREATE TEAM CLICK EVENT **
    //===========================================================

    //===========================================================
    //                ** DELETE TEAM CLICK EVENT **
    //===========================================================

    $('table').on('click', '.nix', function () {
        $.ajax({
            url: "backliftapp/team/" + $(this).attr('data-id'),
            type: "DELETE",
            dataType: "json",
            complete: function () {
                league_array[0].splice($(this).attr('data-index'), 1); //removes entry from league_array
                scheduleCall(); //dynamically changes schedule on add/rm team
            }
        });
        buttonColorDelVar(); //modified button color func for team delete only
        $(this).closest('tr').remove(); //removes team from standings table
    }); //end delete function

    //===========================================================
    //             ** END DELETE TEAM CLICK EVENT **
    //===========================================================

    //===========================================================
    //              ** STANDINGS TABLE FUNCTIONS **
    //===========================================================


    function printTeam(data) { //populates table on page load or refresh. Contains popover. 
        for (var index = 0; index < data.length; index++) {

            //this chunk calculates perventage for each record - added by amcf
            var raw_per = 0;
            var per_toArray = 0;
            var win_per = 0;


            //calculates win percentage to 3 decimal places
            raw_per = (+data[index].wins / (+data[index].wins + +data[index].losses)).toFixed(3);
            if (raw_per < 1) { //if number is less than 1, omit the pre-decimal 0 when displayed.
                per_toArray = raw_per.toString().split('.');
                win_per = '.' + per_toArray[1];
            } else if (isNaN(raw_per)) { //if raw_per isn't a number, write .000
                win_per = ".000";
            } else { //if number is 1, display full number.
                win_per = "1.000";
            };



            $('<tr><td><a rel="popover" data-toggle="popover" title="<h4 style=\'text-align: center;\'>' + data[index].teamName + '</h4>"  data-content="<table id=\'contact_pop\'><tr><td>Manager: </td><td>' + data[index].firstName + " " + data[index].lastName + '</td></tr><tr><td>Phone:</td><td>' + data[index].phoneNumber + '</td></tr><tr><td>Sponsor:</td><td>' + data[index].sponsor + '</td></tr><tr><td>Zip:</td><td>' + data[index].zip + '</td></tr></table>">' + data[index].teamName + '</a><button type="button" class="close nix" style="margin-right: 10px; color: red; opacity: 1;" data-id="' + data[index].id + '" data-index="' + index + '">&times;</button></td><td>' + data[index].wins + '</td><td>' + data[index].losses + '</td><td>' + win_per + '</td></tr>').appendTo('#standings');
        };
    }; //end printTeam func

    function lineWrite(team) { //writes table row when new team is added. Contains popover.
        var index = league_array[0].length;
        $('<tr><td><a rel="popover" data-toggle="popover" title="<h4 style=\'text-align: center;\'>' + $('#teamName').val() + '</h4>"  data-content="<table id=\'contact_pop\'><tr><td>Manager:</td><td>' + $('#mgr_fname').val() + " " + $('#mgr_lname').val() + '</td></tr><tr><td>Phone:</td><td>' + $('#phoneNumber').val() + '</td></tr><tr><td>Sponsor:</td><td>' + $('#sponsor').val() + '</td></tr><tr><td>Zip:</td><td> 37' + $('#zip').val() + '</td></tr></table>">' + $('#teamName').val() + '</a><button type="button" class="close nix" style="margin-right: 10px; color: red; opacity: 1;" data-id="' + (index + 1) + '" data-index="' + index + '">&times;</button></td><td>0</td><td>0</td><td>.000</td></tr>').appendTo('#standings');
    }; //end lineWrite func

    //===========================================================
    //            ** END STANDINGS TABLE FUNCTIONS **
    //===========================================================

    //===========================================================
    //            ** FORM CLEAR/TABLE SORT FUNCTIONS **
    //===========================================================
    
    $("#buttonCancel").click(function(){
        clearForm();
        validateClear();
    });
    
    function clearForm() { //clears form fields on close
        $('.team_inputs').each(function () {
            $(this).val('');
        });
    }; //end clearForm func

    function validateClear() { //resets form validation on opening. 
        $('.control-group').removeClass('success error');
        validate.resetForm();
    }; //end validateClear func

    function sortTable() { //sorts table on new submit
        $("#mytable").trigger("update");
        var sorting = [0, 0];
        $("#mytable").trigger("sorton", [sorting]);
        return false;
    }; //end sortTable func

    //===========================================================
    //         ** END FORM CLEAR/TABLE SORT FUNCTIONS **
    //===========================================================

    //===========================================================
    //               ** START SEASON FUNCTIONS **
    //===========================================================

    //START SEASON CLICK EVENT
    $('#start_season_button').click(function () {
        startSeason();
    }); //start season click event

    /////////////////////////////////////////////////////////////

    function startSeason() { //starts season on click if league conditions are met (min 4 teams)
        if (league_array[0].length >= 4) {
            var answer = confirm("Are you sure you want to start the season? There's no turning back!")
            if (answer) {
                // alert("Play ball!");
                $.ajax({
                    url: "/backliftapp/start",
                    type: "POST",
                    dataType: "json",
                    data: {
                        "trigger": "and so it begins"
                    },
                    success: function (data) {
                        $('<h4>This season is LIVE!</h4>').appendTo('#bigolhead');
                        $('body').addClass('nix_is_hidden');
                        $('#start_season_button').hide();
                        $('#create_team_button').hide();
                        $('#enter_scores_button').show();
                        $('#reset_season_button').show();
                        weekPop();
                    }
                });
            } else {
                alert("What, get cold feet?");
            }
        } else {
            alert("You need at least 4 teams to start the season. Make some friends!");
        }
    }; //end startSeason func	

    function buttonColor() { //changes start season button color based on league size
        if (league_array[0].length >= 4) {
            $('#start_season_button').removeClass('btn-danger').addClass('btn-success');
        } else {
            $('#start_season_button').removeClass('btn-success').addClass('btn-danger');
        }
    }; //end buttonColor

    function buttonColorDelVar() { //buttonColor func slightly modified to work with delete function 
        if (league_array[0].length >= 5) {
            $('#start_season_button').removeClass('btn-danger').addClass('btn-success');
        } else {
            $('#start_season_button').removeClass('btn-success').addClass('btn-danger');
        }
    }; //end buttonColorDelVar

    //===========================================================
    //             ** END START SEASON FUNCTIONS **
    //===========================================================

    //===========================================================
    //                ** SCHEDULE FUNCTIONS **
    //===========================================================


    function scheduleCall() { //dynamically refreshes schedule table
        $('#schedule_table').html('');
        $.ajax({
            type: 'GET',
            url: '/backliftapp/team',
            success: function (data) {
                scheduleWrite(data);
            }
        });
        // clicker = 0;
    };

    //adds slide toggle to schedule table
    $('#schedule_table').on('click', '.slide_head', function () {
        $(this).next('.slide_body').slideToggle();
    }); //end slide function

    function scheduleWrite() { //Decides which function to call to write schedule table (odd or even)

        if (league_array[0].length < 4) {
            $('#schedule_table').hide();
            return false;
        } else if (league_array[0].length === 4) {
            $('#schedule_table').show();
            sched = sched4;
        } else if (league_array[0].length === 5 || league_array[0].length === 6) {
            sched = sched6;
        } else {
            sched = sched8;
        }; // end set sched variable

        if (league_array[0].length % 2 !== 0) {
            writeSchedOdd(sched);
        } else {
            writeSchedEven(sched);
        }; // end even/odd selector
    }; //end scheduleWrite func


    function writeSchedEven(sched) { //writes schedule table head/calls write functions for even-# leagues (4,6,8 teams)

        if (league_array[0].length >= 4) {
            prepTable();
            $('#schedule_head' + i).html('');
            $('#schedule_body' + i).html('');
            for (var i = 0; i < sched.length; i++) { //weeks loop
                $('<tr style="background-color: #8dbdd8;"><th colspan="2"><a>Week ' + (i + 1) + ' Matchups</a></th></tr>').appendTo('#schedule_head' + i);
                for (var j = 0; j < sched[i].length; j++) { //games loop
                    var n = 1;
                    prepSched(i, j, n);
                };
            };
        };
    }; //end writeSchedEven func

    function writeSchedOdd(sched) { //writes schedule table head/calls write functions for odd-# leagues (5,7 teams)

        if (league_array[0].length >= 4) {
            prepTable();
            $('#schedule_head' + i).html('');
            $('#schedule_body' + i).html('');
            for (var i = 0; i < sched.length; i++) { //weeks loop
                $('<tr style="background-color: #8dbdd8;"><th colspan="2"><a>Week ' + (i + 1) + ' Matchups<br><span style="font-weight:200; font-size: 0.9em;">(Bye week: ' + league_array[0][sched[i][0][1] - 2].teamName + ')</span></a></th></tr>').appendTo('#schedule_head' + i);
                for (var j = 1; j < sched[i].length; j++) { //games loop
                    var n = 2;
                    prepSched(i, j, n);
                };
            };
        };
    }; //end writeSchedOdd

    function prepTable() { //preps empty table for schedWrite function
        for (var g = 0; g < sched.length; g++) {
            $('<div class="row-fluid"><table class="span12"><thead id="schedule_head' + g + '" class="slide_head"></thead><tbody class="slide_body" id="schedule_body' + g + '" style="display: none;"></tbody></table></div>').appendTo('#schedule_table');
        };
    }; //end prepTable func

    function prepSched(i, j, n) { //appends schedule info into prepped table for schedWrite function

        // default score place holder
        score_grab1 = 'TBA';
        score_grab2 = 'TBA';

        //if they have scores, append them to score_grab1,2
        $.each(results_array[0], function (index) {
            if ((league_array[0][sched[i][j][0] - n].id + league_array[0][sched[i][j][1] - n].id) == results_array[0][index].gameId) {
                score_grab1 = results_array[0][index].score1;
                score_grab2 = results_array[0][index].score2;
            }
        });

        $('<tr style="background-color: #e6EEEE;"><td colspan="2">' + league_array[0][sched[i][j][0] - n].teamName + " vs. " + league_array[0][sched[i][j][1] - n].teamName + "</td></tr>").appendTo('#schedule_body' + i);
        $('<tr><td>' + league_array[0][sched[i][j][0] - n].teamName + '</td><td>' + score_grab1 + '</td></tr>').appendTo('#schedule_body' + i);
        $('<tr><td>' + league_array[0][sched[i][j][1] - n].teamName + '</td><td>' + score_grab2 + '</td></tr>').appendTo('#schedule_body' + i);

    }; //end prepSched func

    //===========================================================
    //                ** END SCHEDULE FUNCTIONS **
    //===========================================================

    //===========================================================
    //                ** SCORE ENTRY FUNCTIONS **
    //===========================================================

    function weekPop() { //populates weeks selector in enter scores modal
        $('#week_selector').html('');
        $('#week_selector').prepend('<option>Select:</option>');
        if (results_array[0].length === 0) {
            $.each(sched, function (index) {
                var dynIndex = index + 1;
                $('#week_selector').append($("<option></option>").attr("value", index).text("Week " + dynIndex));
            });
        } else { //limits weeks selector to weeks that haven't already been entered.
            var index;
            if (league_array[0].length === 4 || league_array[0].length === 5) {
                index = (results_array[0].length / 2);
            } else if (league_array[0].length === 6 || league_array[0].length === 7) {
                index = (results_array[0].length / 3);
            } else {
                index = (results_array[0].length / 4);
            }

            while (index < sched.length) {
                var dynIndex = index + 1;
                $('#week_selector').append($("<option></option>").attr("value", index).text("Week " + dynIndex));
                index++;
            };
        }
    }; //end weekPop func

    function enterScoresPop() { //populates enter scores modal
        $('#week_selector').change(function () {

            $('#game_scores').html('');
            var selectedItem, gameList;
            selectedItem = $(this).val(); //no. 0-6
            gameList = sched[selectedItem];
            if (league_array[0].length % 2 === 0) { //even
                var count = 1;
                for (var index = 0; index < gameList.length; index++) {
                    var n = 1;
                    prepScores(n, index, gameList, count);
                    count += 2;
                };
            } else { //odd
                $('#bye_announce').text('');
                $('<h4 style="font-weight: 200; margin: 3px 0;">Bye week: ' + league_array[0][gameList[0][1] - 2].teamName + '</h4>').appendTo('#bye_announce');
                $('<input id="week_grab" value="' + (parseInt(selectedItem) + 1) + '" style="display: none;">').appendTo('#bye_announce')
                var count = 1;
                for (var index = 1; index < gameList.length; index++) {
                    var n = 2;
                    prepScores(n, index, gameList, count);
                    count += 2;
                };
            }
        });
    }; //end enterScoresPop

    function prepScores(n, index, gameList, count) { //appends game lists for enter scores modal based on week selected
        $('<div id="game_group' + index + '" class="game_wraps"></div>').appendTo('#game_scores');
        $('<h4 style="text-align: center;">' + league_array[0][gameList[index][0] - n].teamName + ' vs. ' + league_array[0][gameList[index][1] - n].teamName + '</h4>').appendTo('#game_group' + index);
        $('<div class="control-group"><label class="control-label score_labels" for="sponsor">' + league_array[0][gameList[index][0] - n].teamName + '</label><div class="controls"><input type="text" class="score_inputs" id="team_' + count + '" name="team_one_score" placeholder="DOIT"><input id="id_' + count + '" class="score_inputs" value="' + league_array[0][gameList[index][0] - n].id + '" style="display: none;"></div></div>').appendTo('#game_group' + index);
        $('<div class="control-group" style="margin-top: -10px;"><label class="control-label score_labels" for="team_two_score">' + league_array[0][gameList[index][1] - n].teamName + '</label><div class="controls"><input type="text" class="score_inputs" id="team_' + (count + 1) + '" name="team_two_score" placeholder="Score"><input id="id_' + (count + 1) + '" class="score_inputs" value="' + league_array[0][gameList[index][1] - n].id + '" style="display: none;"></div></div>').appendTo('#game_group' + index);
    }; //end prepScores func

    function assignWLs(data) {
        var chop, teams, team1, team2;

        chop = data.gameId;
        teams = chop.toString().split('');
        team1 = teams[0];
        team2 = teams[1];


        if (data.score1 > data.score2) {
            //get win total, add one, send back
            $.ajax({
                url: "backliftapp/team/" + team1,
                type: "PUT",
                dataType: "json",
                async: false,
                data: {
                    wins: +league_array[0][team1 - 1].wins + 1
                },
                //get loss total, add one, send back
                success: function () {
                    $.ajax({
                        url: "backliftapp/team/" + team2,
                        type: "PUT",
                        dataType: "json",
                        data: {
                            losses: +league_array[0][team2 - 1].losses + 1
                        },
                    }); //end PUT
                }
            }); //end PUT			
        } else {
            //get loss total, add one, send back
            $.ajax({
                url: "backliftapp/team/" + team1,
                type: "PUT",
                dataType: "json",
                async: false,
                data: {
                    losses: +league_array[0][team1 - 1].losses + 1
                },
                success: function () {
                    //get win total, add one, send back
                    $.ajax({
                        url: "backliftapp/team/" + team2,
                        type: "PUT",
                        dataType: "json",
                        async: false,
                        data: {
                            wins: +league_array[0][team2 - 1].wins + 1
                        },
                    }); //end PUT
                }
            }); //end PUT
        }
    }; //end assign WLs func

    //===========================================================
    //                ** END SCORE ENTRY FUNCTIONS **
    //===========================================================

    //===========================================================
    //                ** SAVE SCORES CLICK EVENT **
    //===========================================================

    $('#save_scores').click(function () {
        //TO DO - TIES PSEUDO: for ties, write if/else statement. LOOP through all score inputs; IF 2 paired scores are equal, alert "no ties bub" & prevent default; else RUN all this stuff.

        //loop over control groups, grab data, push object to results_array
        var count = 1; //used to assign unique ids to score entry forms
        var loop_count = 0; //used to tell function when all games are printed and it's ok to refresh page

        var schedule;

        if (league_array[0].length % 2 == 0) {
            schedule = sched[0].length;
        } else {
            schedule = sched[0].length - 1;
        }

        $('.game_wraps').each(function (index) {
            var gameId = $('#id_' + count).val() + $('#id_' + (count + 1)).val();
            var score1 = $('#team_' + count).val();
            var score2 = $('#team_' + (count + 1)).val();

            var game = {
                gameId: gameId,
                score1: score1,
                score2: score2
            };
            count += 2;
            $.ajax({
                url: "/backliftapp/results",
                type: "POST",
                dataType: "json",
                data: game,
                async: false,
                success: function (data) {
                    assignWLs(data);
                    loop_count++;
                    if (loop_count == schedule) {
                 
                      location.reload();
                    
                    }
                }
            });
        });
    });

    $('.score_inputs').each(function () {
        $(this).val('');
    });

    //===========================================================
    //              ** END SAVE SCORES CLICK EVENT **
    //===========================================================

    //===========================================================
    //                ** RESTART SEASON FUNCTION **
    //===========================================================

    // Reset season Click Event
    $('#reset_season_button').click(function () {
        // var answer = confirm("Are you sure you want to reset the season? All game results will be permanently erased!")
        // if (answer) {
        //     alert("Bye bye last season!");
            resetSeason();
        // } else {
        //     alert("Phew, that was a close one.");
        // }
    }); // End Reset season click envent

    /////////////////////////////////////////////////////////////

    function resetSeason() {
        var refresh_count = 0;

       	var countCheckForReset = 0;

        $.ajax({ //wipes results from server
            type: 'GET',
            url: '/backliftapp/results',
            success: function (data) {
                $.each(data, function (index) {
                    id = data[index].id;
                    $.ajax({
                        url: "backliftapp/results/" + id,
                        type: "DELETE",
                        dataType: "json",
                        async: false,
                        success: function () {
                        }
                    });
                });

            		countCheckForReset++;
            		if (countCheckForReset === 3) { 
            				location.reload();
            		};
            }
        });

        $.ajax({ //wipes start trigger from server
            type: 'GET',
            url: '/backliftapp/start',
            success: function (data) {
                $.each(data, function (index) {
                    id = data[index].id;
                    $.ajax({
                        url: "backliftapp/start/" + id,
                        type: "DELETE",
                        dataType: "json",
                        async: false,
                        success: function () {
                            $('#bigolhead h4').text('');
                            $('body').removeClass('nix_is_hidden');
                            $('#create_team_button').show();
                            $('#start_season_button').show();
                            $('#enter_scores_button').hide();
                            $('#reset_season_button').hide();
                        }
                    });
                });

                countCheckForReset++;
            		if (countCheckForReset === 3) { 
            				location.reload();
            		};
            }
        });

        $.ajax({ //replaces wins/losses with 0's
            type: 'GET',
            url: '/backliftapp/team',
            success: function (data) {
                $.each(data, function (index) {
                    id = data[index].id;
                    $.ajax({
                        url: "backliftapp/team/" + id,
                        type: "PUT",
                        dataType: "json",
                        async: false,
                        data: {
                            wins: 0,
                            losses: 0
                        },

                    });
                });

                countCheckForReset++;
            		if (countCheckForReset === 3) { 
            				location.reload();
            		};
            }
        });
    };

    //===========================================================
    //              ** END RESTART SEASON FUNCTION **
    //===========================================================

    //===========================================================
    //                ** FORM VALIDATION **
    //===========================================================

    var validate = $("#modal_form").validate({
        rules: {
            teamName: {
                minlength: 2,
                maxlength: 32,
                required: true
            },
            mgr_fname: {
                minlength: 2,
                maxlength: 20,
                required: true
            },
            mgr_lname: {
                minlength: 2,
                maxlength: 20,
                required: true
            },
            phone: {
                digits: true,
                required: true,
                rangelength: [10, 10]
            },
            sponsor: {
                minlength: 2,
                maxlength: 20,
                required: true
            },
            zip: {
                digits: true,
                required: true,
                rangelength: [3, 3]
            }
        },
        highlight: function (element) {
            $(element).closest('.control-group').removeClass('success').addClass('error');
        },
        success: function (element) {
            element.text('OK!').addClass('valid')
                .closest('.control-group').removeClass('error').addClass('success');
        }
    }); //end validation func

    //===========================================================
    //                ** END FORM VALIDATION **
    //===========================================================

}); //end doc ready