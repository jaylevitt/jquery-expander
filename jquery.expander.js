/*
 * jQuery Expander plugin
 * Version 0.5.1 (February 23, 2010)
 * @requires jQuery v1.1.1+
 * @author Karl Swedberg
 * @author Adam Hall
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */


(function($) {

  $.fn.expander = function(options) {

    var opts = $.extend({}, $.fn.expander.defaults, options),
        rSlash = /\//,
        delayedCollapse;

    this.each(function() {
      var thisEl = this, $this = $(this);
      var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
      var cleanedTag, startTags, endTags;
      var allText = $this.html();
      var startText = allText.slice(0, o.slicePoint).replace(/(&([^;]+;)?|\w+)$/,'');

      startTags = startText.match(/<\w[^>]*>/g);
      
      if (startTags) {
        startText = allText.slice(0,o.slicePoint + startTags.join('').length).replace(/(&([^;]+;)?|\w+)$/,'');
      }

      if (startText.lastIndexOf('<') > startText.lastIndexOf('>') ) {
        startText = startText.slice(0,startText.lastIndexOf('<'));
      }

      var defined = {};
      $.each(['onSlice','beforeExpand', 'afterExpand', 'onCollapse'], function(index, val) {
        defined[val] = $.isFunction(o[val]);
      });

      var endText = allText.slice(startText.length);
      // create necessary expand/collapse elements if they don't already exist
      if (!$('span.details', this).length) {
        // end script if text length isn't long enough.
        if ( endText.replace(/\s+$/,'').split(' ').length < o.widow ) { return; }
        // otherwise, continue...
        if (defined.onSlice) { o.onSlice.call(thisEl); }
        if (endText.indexOf('</') > -1) {
          endTags = endText.match(/<(\/)?[^>]*>/g);
          for (var i=0; i < endTags.length; i++) {

            if (endTags[i].indexOf('</') > -1) {
              var startTag, startTagExists = false;
              for (var j=0; j < i; j++) {
                startTag = endTags[j].slice(0, endTags[j].indexOf(' ')).replace(/\w$/,'$1>');
                if (startTag == endTags[i].replace(rSlash,'')) {
                  startTagExists = true;
                }
              }
              if (!startTagExists) {
                startText = startText + endTags[i];
                var matched = false;
                for (var s=startTags.length - 1; s >= 0; s--) {
                  if (startTags[s].slice(0, startTags[s].indexOf(' ')).replace(/(\w)$/,'$1>') == endTags[i].replace(rSlash,'')
                  && matched == false) {
                    cleanedTag = cleanedTag ? startTags[s] + cleanedTag : startTags[s];
                    matched = true;
                  }
                };
              }
            }
          }

          endText = cleanedTag && cleanedTag + endText || endText;
        }
        //Firstly I store the original text in the control. This has all the original formatting.
        $this.data("originalHTML", allText);
        //Then a store a variable with the compressed text. We can simply switch between these two variables.
        $this.data("compressedHTML", [
          startText,
          '<span class="read-more">',
            o.expandPrefix,
            '<a href="#">',
              o.expandText,
            '</a>',
          '</span>',
          '<div class="details">', //This needs to be a DIV to honour any block elements (a span will cause faulty HTML)
            endText,
          '</div>'
          ].join('')
        );
        //Now apply the compressed text to the container
        $this.html($this.data("compressedHTML"));
        //Create a new function that applies the click actions to the "ReadMore" link.
        $this.bind("ReBindClicks", function() {
      var $thisDetails = $('.details', this),
          $readMore = $('span.read-more', this);

      $thisDetails.hide();
      $readMore.find('a').click(function() {
        $readMore.hide();

        if (o.expandEffect === 'show' && !o.expandSpeed) {
          if (defined.beforeExpand) {o.beforeExpand.call(thisEl);}
          $thisDetails.show();
          if (defined.afterExpand) {o.afterExpand.call(thisEl);}
          delayCollapse(o, $thisDetails, thisEl);
          completedExpand();//here we switch back the elements
        } else {
          if (defined.beforeExpand) {o.beforeExpand.call(thisEl);}
          $thisDetails[o.expandEffect](o.expandSpeed, function() {
            $thisDetails.css({zoom: ''});
            if (defined.afterExpand) {o.afterExpand.call(thisEl);}
            delayCollapse(o, $thisDetails, thisEl);
      if (o.userCollapse) {
        //Because we have the variables stored, we have to change the way we deal with these elements slightly.
        $this.html($this.data("originalHTML"));
        $this.append('<span class="re-collapse">' + o.userCollapsePrefix + '<a href="#">' + o.userCollapseText + '</a></span>');
        $this.find('span.re-collapse a').click(function() {
          clearTimeout(delayedCollapse);
          $para = $(this).parent().parent(); //Get the expanding element again...
          $para.html($para.data("compressedHTML"));
          $para.trigger("ReBindClicks"); //Because we have the original function to attach events, we simply call that again.
          if (defined.onCollapse) {o.onCollapse.call(thisEl, true);}
          return false;
        });
      }
          });
        }

            return false;
          });


        });
        $this.trigger("ReBindClicks"); //Bind the clicks - actually this one is for the first time.
      };

    });

//No need for the reCollapse function, this is now found inside the click event
    function delayCollapse(option, $collapseEl, thisEl) {
      if (option.collapseTimer) {
        delayedCollapse = setTimeout(function() {
          reCollapse($collapseEl);
          if ($.isFunction(option.onCollapse)) {option.onCollapse.call(thisEl, false);}
          }, option.collapseTimer
        );
      }
    }

    return this;
  };
    // plugin defaults
  $.fn.expander.defaults = {
    slicePoint:       100,  // the number of characters at which the contents will be sliced into two parts.
                            // Note: any tag names in the HTML that appear inside the sliced element before
                            // the slicePoint will be counted along with the text characters.
    widow:            4,  // a threshold of sorts for whether to initially hide/collapse part of the element's contents.
                          // If after slicing the contents in two there are fewer words in the second part than
                          // the value set by widow, we won't bother hiding/collapsing anything.
    expandText:       'read more', // text displayed in a link instead of the hidden part of the element.
                                      // clicking this will expand/show the hidden/collapsed text
    expandPrefix:     '&hellip; ',
    collapseTimer:    0, // number of milliseconds after text has been expanded at which to collapse the text again
    expandEffect:     'fadeIn',
    expandSpeed:      '',   // speed in milliseconds of the animation effect for expanding the text
    userCollapse:     true, // allow the user to re-collapse the expanded text.
    userCollapseText: '[collapse expanded text]',  // text to use for the link to re-collapse the text
    userCollapsePrefix: ' ',

    /* CALLBACK FUNCTIONS
        ** all functions have the this keyword mapped to the element that called .expander()
    */
    onSlice: null, // function() {}
    beforeExpand: null, // function() {},
    afterExpand: null, // function() {},
    onCollapse: null // function(byUser) {}
  };
})(jQuery);
