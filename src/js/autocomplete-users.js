;(function(){
    'use strict';

    var _inputs = document.querySelectorAll('[autocomplete-users]'),

        _suggestionKey,

        // given the root input's html string
        // we will pull out anything that we have already
        // formatted or generated ourselves.
        // This is used to help prevent generated content
        // from triggering suggestions themselves
        _getRootTextContents = function(htmlBlob){
            var nonTextNodes,
                tempDiv = document.createElement('div');

            tempDiv.innerHTML = htmlBlob;

            // remove the known generated content
            nonTextNodes = tempDiv.querySelectorAll('input[disabled]');

            Array.prototype.forEach.call(nonTextNodes, function(node){
                tempDiv.removeChild(node);
            });

            return tempDiv.innerHTML;
        },

        _createSuggestionInputNode = function(suggestedUser){

            // we have to user input[type=button][disabled]
            // because firefox is not correctly handling
            // span[contenteditable=false]
            // see:
            // https://bugzilla.mozilla.org/show_bug.cgi?id=685445
            // https://bugzilla.mozilla.org/show_bug.cgi?id=439808

            var input = document.createElement('input');
            input.setAttribute('disabled', 'true');
            input.setAttribute('type', 'button');
            input.className = 'injected-autocomplete-user';
            // prefix @ symbol to let users know how to link
            // in the future
            input.value = '@' + suggestedUser.username;

            return input;
        },

        _dialog = (function(){
            var visible = false,
                dialogContainer,
                hideDialog = function(){
                    if(dialogContainer){
                        dialogContainer.parentNode.removeChild(dialogContainer);
                        dialogContainer = null;
                    }
                    visible = false;
                },
                handleClickSuggestionSelection = function(event){
                    _processInput(null, parseInt(this.getAttribute('user-id')));
                    _dialog.select();
                    event.preventDefault();
                    return false;
                };

            return {
                update: function(users){

                    var listFragment,
                        listContainer;

                    // no users will hide the dialog
                    if(!users || users.length === 0){
                        hideDialog();
                        return;
                    }

                    // if we have users, show the dialog
                    visible = true;
                    listFragment = document.createDocumentFragment();

                    users.forEach(function(user, index){
                        var li = document.createElement('li');
                        li.innerHTML = '<div>' + user.name  + '</div>';
                        li.setAttribute('user-id', user.id);

                        // event delegation would be better
                        // but we are not expecting these lists to contain
                        // large sets of users.
                        // Note: use mouse down so we can suppress the
                        // default behavior of moving the selection area
                        li.onmousedown = handleClickSuggestionSelection;


                        // first item for a new list is selected by default
                        if(index === 0){
                            li.className = 'js-selected';
                        }

                        listFragment.appendChild(li);
                    });

                    listContainer = document.createElement('ul');
                    listContainer.appendChild(listFragment);

                    if(!dialogContainer){
                        dialogContainer = document.createElement('div');
                        dialogContainer.setAttribute('autocomplete-dialog', 'true');
                        document.body.appendChild(dialogContainer);
                    }else {
                        // empty existing container
                        dialogContainer.innerHTML = '';
                    }

                    dialogContainer.appendChild(listContainer);
                },
                up: function(){
                    var current = dialogContainer.querySelector('li.js-selected'),
                        previous = current.previousSibling;

                    if(previous){
                        current.classList.remove('js-selected');
                        previous.classList.add('js-selected');
                    }
                },
                down: function(){
                    var current = dialogContainer.querySelector('li.js-selected'),
                        next = current.nextSibling;

                    if(next){
                        current.classList.remove('js-selected');
                        next.classList.add('js-selected');
                    }
                },
                select: function(){
                    hideDialog();
                },
                isVisible: function(){
                    return visible;
                }
            };
        })(),

        // suggestionUpdate takes the keycodes and the known
        // lookup key and decides if we are in a
        _calculateSuggestionSelection = (function(){

            var userMappings = [],
                filteredMatches = [],
                currentSelectionIndex = 0;

            // when we load this is important
            // but for the purpose of this program
            // we will load it immediately and assume that
            // the intent of the user at this point is to
            // write a comment. Can easily be reworked
            // if we do not have a high enough confidence in
            // the users intent or need for this data.
            // Additionally, we would be better off having a
            // service that we can get a subset of data based
            // on initial piece of lookup key. - do the work server side.
            //
            // Let's at least put at the bottom of the queue so
            // to not block anything else.
            setTimeout(function(){
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '/data/data.json', true);
                xhr.onreadystatechange = function () {
                    if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                        try{
                            userMappings = JSON.parse(xhr.responseText);
                        }catch(e){
                            console.error(e);
                        }
                    }
                };
                xhr.send();
            }, 0);


            return function(keycode, lookupKey, userId){

                var selectedSuggestion;

                // if the calculation is already done for us.
                // find the user in reference and return it
                if(userId){
                    return filteredMatches.filter(function(user){
                        return user.id = userId;
                    })[0];
                }

                // handle going up and down the list selections
                if(_isDialogDirectionKey(keycode)){
                    if(keycode === 38){
                        _dialog.up();

                        if(currentSelectionIndex > 0){
                            currentSelectionIndex--;
                        }

                    } else if(keycode === 40){
                        _dialog.down();

                        if(currentSelectionIndex < filteredMatches.length - 1){
                            currentSelectionIndex++;
                        }
                    }
                    return;
                }

                if(_isDialogSelectKey(keycode)){
                    _dialog.select();

                    selectedSuggestion = filteredMatches[currentSelectionIndex];

                    // reset tracking variables
                    filteredMatches = [];
                    currentSelectionIndex = 0;

                    return selectedSuggestion;
                }



                if(!lookupKey){
                    _dialog.update();
                    return;
                }

                filteredMatches = userMappings.filter(function(user){
                    return ((user.name || '').toLowerCase().indexOf(lookupKey.toLowerCase()) > -1)
                            || ((user.username || '').toLowerCase().indexOf(lookupKey.toLowerCase()) > -1);
                });

                _dialog.update(filteredMatches);
            };
        })(),

        _getSuggestionKeyFromHtml = function(blob){

            var triggerIndex,
                keyScope,
                wordSegments,
                TRIGGER_CHAR = '@',

                // db max bound for fields
                KEY_MAX_LENGTH = 256;

            if(!blob){
                return;
            }

            // we accept the blob as html so we can exclude
            // any already captured users/generated content
            blob = _getRootTextContents(blob);

            // chrome is injecting nbsp with some combinations
            // of space usage
            // https://bugs.chromium.org/p/chromium/issues/detail?id=310149
            blob = blob.replace(/\&nbsp\;/g, ' ');

            // scope the check to start at the last known @ symbol
            triggerIndex = blob.lastIndexOf(TRIGGER_CHAR);

            keyScope = triggerIndex > -1 ? blob.substr(triggerIndex) : '';

            // on main scoping factor is how large the text
            // can be stored in the database. So we will use that
            // to give us an upper bounds for checking
            // This is needed so that we are not arbitrarily mapping
            // every bit of text after the trigger character every
            // time someone types
            if(!keyScope || keyScope.length > KEY_MAX_LENGTH + 1){
                return;
            }
            return keyScope;
        },

        _processInput = function(currentKeycode, explicitUserId){

            var selection = window.getSelection(),
                range = selection.rangeCount > 0 && selection.getRangeAt(0),
                inputEl = document.activeElement,
                precedingChar,
                previousContents;

            // are we in suggestion mode?
            // update the suggestion widget with value
            //      values to update on: word, arrow direction, enter selection
            // when finished, update dom with new link

            if(!range){
                return;
            }

            var textNodeToUpdate;

            // the suggestion key will have all of the content including
            // the '@' symbol if we have a good match
            var suggestionKey = _getSuggestionKeyFromHtml(range.endContainer.nodeValue);

            // if we have a suggestion
            var lookupKey = (suggestionKey || '').substr(1);

            // console.log(fragmentContainer.innerHTML);


            var selectedSuggestion = _calculateSuggestionSelection(currentKeycode, lookupKey, explicitUserId);


            if(selectedSuggestion){

                var newSuggestionBlock = _createSuggestionInputNode(selectedSuggestion);

                range.insertNode(newSuggestionBlock);

                // remove the matching key that we know about before adding the suggested block
                textNodeToUpdate = newSuggestionBlock.previousSibling;
                if(textNodeToUpdate.nodeValue){
                    textNodeToUpdate.nodeValue = textNodeToUpdate.nodeValue.replace(suggestionKey, '');
                }

                // put the cursor to the right of these nodes
                range.selectNode(newSuggestionBlock.nextSibling);
                range.collapse(true);

                selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

        },

        _isDialogDirectionKey = function(keycode){
            return _dialog.isVisible() && [/*up*/38, /*down*/40].indexOf(keycode) > -1;
        },

        _isDialogSelectKey = function(keycode){
            return _dialog.isVisible() && keycode === 13;
        },

        _keyDownHandler = function(event){

            var keycode = event.which;

            // we handle dialog actions in key down
            // so that we can prevent any weird
            // experiences with the default
            if(_isDialogDirectionKey(keycode) || _isDialogSelectKey(keycode)){

                // if the dialog is open we can prevent the
                // default action of the up and down arrow keystrokes
                // easier from keydown. If we know it will result in a
                // dialog selection toggle we will prevent default
                if(_isDialogDirectionKey(keycode)){
                    _calculateSuggestionSelection(keycode);
                }

                if(_isDialogSelectKey(keycode)){
                    // call process one final time to get the
                    // key and submit it to get the suggestion block added
                    _processInput(keycode);
                }

                event.preventDefault();
                return false;
            }
        },

        _keyUpHandler = function(event){

            var keycode = event.which;

            // can't prevent keyup from keydown
            // since we handle dialog actions in keydown
            // we need to ignore it here so as to not
            // duplicate actions
            if(_isDialogDirectionKey(keycode) || _isDialogSelectKey(keycode)){
                return;
            }

            _processInput(keycode);
        },


        // make sure the paste data that we are trying to put into the
        // content area is stripped of html on input
        _pasteHandler = function(e){
            e.preventDefault();
            var text = '';
            if (e.clipboardData || e.originalEvent.clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData('text/plain');
            } else if (window.clipboardData) {
                text = window.clipboardData.getData('Text');
            }
            if (document.queryCommandSupported('insertText')) {
                document.execCommand('insertText', false, text);
            } else {
                document.execCommand('paste', false, text);
            }
        };


    // Assign all of the appropriate event bindings
    // to the matching input elements
    Array.prototype.forEach.call(_inputs, function(inputEl){
        inputEl.addEventListener('keydown', _keyDownHandler);
        inputEl.addEventListener('keyup', _keyUpHandler);
        inputEl.addEventListener('paste', _pasteHandler);
    });




})();
