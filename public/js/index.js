/*
 * Wikipedia Game
 *
 * todo: 
 *  - create a button and input field to "start a game"
 *  - input captures "end url" or "topic" that the user wishes to find
 *  - maybe refresh the page with a param to start game on server side 
 *  - prevent user from copy and pasting into the url bar or searching the topic directly.  Possibly attach a token to each link?
 *  - build client side with gulp
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

    WikiGame.prototype.verifyHost = function(link){
        return link.hostname === this.hostname;
    };

    WikiGame.prototype.verifyLink = function(link){
        return link.pathname.split('/')[1] === 'wiki';
    };

    WikiGame.prototype.proxyLink = function(e){

        e.preventDefault();

        var link = e.currentTarget;

        //external links should open in a new tab
        if(!this.verifyHost(link)){
            win.open(link.href);
            return false;
        }

        //all /wiki/ links should point to our term detail page
        if(this.verifyLink(link)){
            win.location = link.href;
        }
        
    };

    WikiGame.prototype.proxyForm = function(e){

        var $form = $(e.currentTarget);

        switch ($form.prop('id')) {
            
            case 'searchform':
                
                win.location = '/wiki/' + $('#searchInput').val().replace(/ /g, '_');
                return false;
                break;

            case 'newGameForm':

                return this.startNewGame($form);

                break;

            default:

                console.log('Form not programmed for this game')
                return false;

        }

    };

    WikiGame.prototype.startNewGame = function($form){
        
        var link = doc.createElement('A');

        link.href = $form.find('input[name="endUrl"]').val();
        
        //eventually we'll just use a topic instead of an url...
        if(!this.verifyHost(link) && !this.verifyLink(link)){
            alert('please enter a wikipedia link');
            return false;    
        }

        return true;
    
    };

    var game = new WikiGame();

})(window, document, jQuery);


