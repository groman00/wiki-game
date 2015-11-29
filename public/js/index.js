/*
 * Wikipedia Game
 */

(function(win, doc, $){

    //globals
    var $doc = $(doc),
        util = win.UTIL;



    function WikiGame(){
        
        $doc
            .on('click', 'a', this.proxyLink.bind(this))
            .on('submit', 'form', this.proxyForm.bind(this));

    };

    WikiGame.prototype.proxyLink = function(e){

        e.preventDefault();

        var link = $(e.currentTarget);
        console.log(link);

        alert('links are disabled, logic needed...');

    };

    WikiGame.prototype.proxyForm = function(e){

        var $form = $(e.currentTarget);

        if($form.prop('id') === 'searchform'){

            win.location = '/wiki/' + $('#searchInput').val().replace(/ /g, '+');

        }else{

            throw('Form not programmed for this game');

        }

        return false;

    };

    var game = new WikiGame();

})(window, document, jQuery);


