var App = SC.Application.create();

// Put jQuery UI inside its own namespace
JQ = {};

// Create a new mixin for jQuery UI widgets using the new SproutCore 2.0
// mixin syntax.
JQ.Widget = SC.Mixin.create({
  // When SproutCore creates the view's DOM element, it will call this
  // method.
  didCreateElement: function() {
    this._super();

    // Make jQuery UI options available as SproutCore properties
    var options = this._gatherOptions();

    // Make sure that jQuery UI events trigger methods on this view.
    this._gatherEvents(options);

    // Create a new instance of the jQuery UI widget based on its `uiType`
    // and the current element.
    var ui = jQuery.ui[this.get('uiType')](options, this.get('element'));

    // Save off the instance of the jQuery UI widget as the `ui` property
    // on this SproutCore view.
    this.set('ui', ui);
  },

  // When SproutCore tears down the view's DOM element, it will call
  // this method.
  willDestroyElement: function() {
    var ui = this.get('ui');

    if (ui) {
      // Tear down any observers that were created to make jQuery UI
      // options available as SproutCore properties.
      var observers = this._observers;
      for (var prop in observers) {
        if (observers.hasOwnProperty(prop)) {
          this.removeObserver(prop, observers[prop]);
        }
      }
      ui._destroy();
    }
  },

  // Each jQuery UI widget has a series of options that can be configured.
  // For instance, to disable a button, you call
  // `button.options('disabled', true)` in jQuery UI. To make this compatible
  // with SproutCore bindings, any time the SproutCore property for a
  // given jQuery UI option changes, we update the jQuery UI widget.
  _gatherOptions: function() {
    var uiOptions = this.get('uiOptions'), options = {};

    // The view can specify a list of jQuery UI options that should be treated
    // as SproutCore properties.
    uiOptions.forEach(function(key) {
      options[key] = this.get(key);

      // Set up an observer on the SproutCore property. When it changes,
      // call jQuery UI's `setOption` method to reflect the property onto
      // the jQuery UI widget.
      var observer = function() {
        var value = this.get(key);
        this.get('ui')._setOption(key, value);
      };

      this.addObserver(key, observer);

      // Insert the observer in a Hash so we can remove it later.
      this._observers = this._observers || {};
      this._observers[key] = observer;
    }, this);

    return options;
  },

  // Each jQuery UI widget has a number of custom events that they can
  // trigger. For instance, the progressbar widget triggers a `complete`
  // event when the progress bar finishes. Make these events behave like
  // normal SproutCore events. For instance, a subclass of JQ.ProgressBar
  // could implement the `complete` method to be notified when the jQuery
  // UI widget triggered the event.
  _gatherEvents: function(options) {
    var uiEvents = this.get('uiEvents') || [], self = this;

    uiEvents.forEach(function(event) {
      var callback = self[event];

      if (callback) {
        // You can register a handler for a jQuery UI event by passing
        // it in along with the creation options. Update the options hash
        // to include any event callbacks.
        options[event] = function(event, ui) { callback.call(self, event, ui); };
      }
    });
  }
});

// Create a new SproutCore view for the jQuery UI Button widget
JQ.Button = SC.View.extend(JQ.Widget, {
  uiType: 'button',
  uiOptions: ['label', 'disabled'],

  tagName: 'button'
});

// Create a new SproutCore view for the jQuery UI Menu widget (new
// in jQuery UI 1.9). Because it wraps a collection, we extend from
// SproutCore's CollectionView rather than a normal view.
//
// This means that you should use `#collection` in your template to
// create this view.
JQ.Menu = SC.CollectionView.extend(JQ.Widget, {
  uiType: 'menu',
  uiOptions: ['disabled'],
  uiEvents: ['select'],

  tagName: 'ul',

  // Whenever the underlying Array for this `CollectionView` changes,
  // refresh the jQuery UI widget.
  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);

    var ui = this.get('ui');
    if(ui) { ui.refresh(); }
  }
});

// Create a new SproutCore view for the jQuery UI Progrress Bar widget
JQ.ProgressBar = SC.View.extend(JQ.Widget, {
  uiType: 'progressbar',
  uiOptions: ['value', 'max'],
  uiEvents: ['change', 'complete']
});

// Create a simple controller to hold values that will be shared across
// views.
App.controller = SC.Object.create({
  progress: 0,
  menuDisabled: true
});

// Create a subclass of `JQ.Button` to define behavior for our button.
App.Button = JQ.Button.extend({
  // When the button is clicked...
  click: function() {
    // Disable the button.
    this.set('disabled', true);

    // Increment the progress bar.
    this.increment();
  },

  increment: function() {
    var self = this;

    // Get the current progress value from the controller.
    var val = App.controller.get('progress');

    if(val < 100) {
      // If the value is less than 100, increment it.
      App.controller.set('progress', val + 1);

      // Schedule another increment call from 30ms.
      setTimeout(function() { self.increment() }, 30);
    }
  }
});

// Create a subclass of `JQ.ProgressBar` to define behavior for our
// progress bar.
App.ProgressBar = JQ.ProgressBar.extend({
  // When the jQuery UI progress bar reaches 100%, it will invoke the
  // `complete` event. Recall that JQ.Widget registers a callback for
  // the `complete` event in `didCreateElement`, which calls the
  // `complete` method.
  complete: function() {
    // When the progress bar finishes, update App.controller with the
    // list of people. Because our template binds the JQ.Menu to this
    // value, it will automatically populate with the new people and
    // refresh the menu.
    App.controller.set('people', [
      SC.Object.create({
        name: "Tom DAAAAALE"
      }),
      SC.Object.create({
        name: "Yehuda Katz"
      }),
      SC.Object.create({
        name: "Majd Potatoes"
      })
    ]);

    // Set the `menuDisabled` property of our controller to false.
    // Because the JQ.Menu binds its `disabled` property to
    // App.controller.menuDisabled, this will enable it.
    App.controller.set('menuDisabled', false);
  }
});

/**
Template:

{{view App.Button label="Click to Load People"}}
<br><br>
{{view App.ProgressBar valueBinding="App.controller.progress"}}
<br><br>
{{#collection JQ.Menu
             contentBinding="App.controller.people"
             disabledBinding="App.controller.menuDisabled"}}
 <a href="#">
   {{content.name}}
   {{view JQ.Button labelBinding="parentView.content.name"}}
 </a>
{{else}}
 <a href="#">LIST NOT LOADED</a>
{{/collection}}
*/
