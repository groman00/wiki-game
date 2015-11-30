/*
 * Wikipedia Game
 *
 * todo: 
 *  - create a button and input field to "start a game"
 *  - input captures "end url" that the user wishes to find
 *  - maybe refresh the page with a param to start game on server side 
 *  - prevent user from copy and pasting into the url bar.  Possibly attach a token to each link?
 */

(function(win, doc, $){

    //globals
    var $doc = $(doc),
        util = win.UTIL;

    function WikiGame(){
        
        this.hostname = win.location.hostname;

        $doc
            .on('click', 'a', this.proxyLink.bind(this))
            .on('submit', 'form', this.proxyForm.bind(this));

    };

    WikiGame.prototype.proxyLink = function(e){

        e.preventDefault();

        var link = e.currentTarget;
        console.log(link);

        //external links should open in a new tab
        if(link.hostname !== this.hostname){
            win.open(link.href);
            return false;
        }

        //all /wiki/ links should point to our term detail page
        if(link.pathname.split('/')[1] === 'wiki'){
            win.location = link.href;
        }
        
    };

    WikiGame.prototype.proxyForm = function(e){

        var $form = $(e.currentTarget);

        if($form.prop('id') === 'searchform'){

            win.location = '/wiki/' + $('#searchInput').val().replace(/ /g, '_');

        }else{

            throw('Form not programmed for this game');

        }

        return false;

    };

    var game = new WikiGame();

})(window, document, jQuery);


