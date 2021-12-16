/**
2021 Crossword Nexus
MIT License
https://mit-license.org/

**/

var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

function find_crossers(words, revealer, position, mydict) {
    /**
    * Finds possible grids
    * Returns an array of possible pairs of entries, with their intersection positions
    **/
    // Step 1: find a list of entries with our words in them at the right positions

    var crossers_arr = [];

    var i;
    var word_to_entries = {};
    Object.keys(mydict).forEach((entry, ix) => {
        for (i=0; i<words.length; i++) {
           var word = words[i];
           if (entry == word) {
               continue;
           }
           if (position == 'front' && entry.startsWith(word)) {
               word_to_entries[word] = (word_to_entries[word] || []).concat([entry]);
           } else if (position == 'back' && entry.endsWith(word)) {
               word_to_entries[word] = (word_to_entries[word] || []).concat([entry]);
           } else if (position == 'middle' && entry.indexOf(word) > 0 && !entry.endsWith(word)) {
               word_to_entries[word] = (word_to_entries[word] || []).concat([entry]);
           }
       }
    });

    var POSSIBLE_WORDS = Object.keys(word_to_entries);

    if (POSSIBLE_WORDS.length < 2) {
        return [];
    }

    /**
     * helper function to find all locations of a substring in a string
     * this has been modified to find only the "good" locations
    **/
    function good_locations(my_chr, string, revealer_length=15){
      var OK_LOCATIONS = [2,3,4,5,6,8,9,10,11,12];
      var a=[];
      OK_LOCATIONS.forEach(ix => {
          if (string.charAt(ix) == my_chr) {
              a.push(ix);
          }
      });
      return a;
    }

    /* helper function to see if two entries work with a revealer */
    // Note: e1.length must equal e2.length; revealer.length == 15
    function do_entries_work(e1, e2, revealer) {
        var ret_arr = [];
        var e1_length = e1.length; var e2_length = e2.length;
        var revealer_length = revealer.length;
        if (e1_length != e2_length) {return [];}
        //if (revealer.length != 15) {return [];}
        // loop through possible entry 1 intersection positions
        for (var e1_pos = e1_length - 8; e1_pos < 8; e1_pos++) {
            var e1_let = e1.charAt(e1_pos);
            // find the locations of this letter in our revealer
            var e1_arr = good_locations(e1_let, revealer);
            e1_arr.forEach(e1_ix => {
                if (e2.charAt(e2_length-e1_pos-1) == revealer.charAt(revealer_length-1-e1_ix)) {
                    ret_arr.push([e1_ix, revealer_length-1-e1_ix]);
                }
            });
        }
        return ret_arr;
    }

    // Step 2:
    // Loop through all positions for the intersection
    POSSIBLE_WORDS.flatMap(
        (v, i) => POSSIBLE_WORDS.slice(i+1).map( w => {
            // v and w are our words
            // but we need to loop through the possible entries for each
            word_to_entries[v].forEach(e1 => {
                word_to_entries[w].forEach(e2 => {
                    var does_work = do_entries_work(e1, e2, revealer);
                    does_work.forEach(my_arr => {
                        crossers_arr.push([e1, e2].concat(my_arr));
                    });
                });
            });
        })
    );
    return crossers_arr;
}

var dict = {};

$(document).ready(function () {
    // hide and show relevant sections
    $('#rc-form').hide();
    $('#loading').show();
    // fetch the data
    if(typeof window.fetch === "function") {
      fetch('wordlist.txt.zip')
      .then(function (response) {
        if (response.status === 200 || response.status === 0) {
          return Promise.resolve(response.arrayBuffer())
        } else {
          return Promise.reject(new Error(response.statusText))
        }
      })
      .then(JSZip.loadAsync)
      .then(function (zip) {
        return zip.file("wordlist.txt").async("string");
      })
      .then(function success(data) {
        // populate dictionary
        var list = data.split('\n');
        for (var i=0; i<list.length; i++) {
            var this_word = list[i];
            if (this_word.charAt(0) != '#') {
                // we only want words of certain lengths
                if (this_word.length == 9 || this_word.length == 10 || this_word.length == 11 || this_word.length == 15) {
                    dict[this_word] = true;
                }
            }
        }
        // hide and show
        $('#rc-form').show();
        $('#loading').hide();

        // Read URL parameters
        /*
        if (QueryString.pattern && QueryString.repl) {
            $('input[name=pattern]').val(QueryString.pattern);
            $('input[name=repl]').val(QueryString.repl);
            populate_results(QueryString.pattern.toUpperCase(),QueryString.repl.toUpperCase(),dict,0);
        }
        */

        // Handle form submission
        $('#rc-form').submit(function(event) {
            // Don't actually submit the form
            event.preventDefault();
            var position = $("input[name='position']:checked").val();
            //console.log($('input'));
            var words1 = $('#words').val().split('\n');
            //console.log($('#words')).val();
            var words = [];
            for (var i=0; i<words1.length; i++) {
                var w = words1[i].trim().toUpperCase();
                words.push(w);
            }
            var revealer = $('input[name=revealer]').val().toUpperCase();
            console.log(position);
            var crossers_arr = find_crossers(words, revealer, position, dict);
            console.log(crossers_arr);
            var my_result = '';
            crossers_arr.forEach(my_arr => {
                my_result += my_arr[0] + ' (' + (my_arr[2]+1) + ') ' + my_arr[1] + ' (' + (my_arr[3]+1) + ')<br />\n';
            });
            console.log(my_result);
            $('#results').html(my_result);
            if (!crossers_arr) {
                $('#results').html('No results');
            }
        });


      }, function error(e) {
        alert(e);
      });
    } else {
      $('#loading').text('This browser does not support the Fetch API.  Please use Firefox or Chrome to use this page.');
    }
  });
