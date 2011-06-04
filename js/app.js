var App = SC.Application.create();

JQ = {};

JQ.Widget = SC.Mixin.create({
  didCreateElement: function() {
    this._super();

    var options = this._gatherOptions();
    this._gatherEvents(options);

    var ui = jQuery.ui[this.get('uiType')](options, this.get('element'));

    this.set('ui', ui);
  },

  _gatherEvents: function(options) {
    var uiEvents = this.get('uiEvents') || [], self = this;

    uiEvents.forEach(function(event) {
      var callback = self[event];

      if (callback) {
        options[event] = function(event, ui) { callback.call(self, event, ui); };
      }
    });
  },

  willDestroyElement: function() {
    var ui = this.get('ui');
    if (ui) {
      var observers = this._observers;
      for (var prop in observers) {
        if (observers.hasOwnProperty(prop)) {
          this.removeObserver(prop, observers[prop]);
        }
      }
      ui._destroy();
    }
  },

  _gatherOptions: function() {
    var uiOptions = this.get('uiOptions'), options = {};

    uiOptions.forEach(function(key) {
      options[key] = this.get(key);

      var observer = function() {
        var value = this.get(key);
        this.get('ui')._setOption(key, value);
      };

      this.addObserver(key, observer);
      this._observers = this._observers || {};
      this._observers[key] = observer;
    }, this);

    return options;
  }
});

JQ.Button = SC.View.extend(JQ.Widget, {
  uiType: 'button',
  uiOptions: ['label', 'disabled'],

  tagName: 'button'
});

JQ.Menu = SC.CollectionView.extend(JQ.Widget, {
  uiType: 'menu',
  uiOptions: ['disabled'],
  uiEvents: ['select'],

  tagName: 'ul',

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);

    var ui = this.get('ui');
    if(ui) { ui.refresh(); }
  }
});

App.controller = SC.Object.create({
  progress: 0,
  menuDisabled: true
});

JQ.ProgressBar = SC.View.extend(JQ.Widget, {
  uiType: 'progressbar',
  uiOptions: ['value', 'max'],
  uiEvents: ['change', 'complete']
});

App.Button = JQ.Button.extend({
  click: function() {
    var self = this;
    this.set('disabled', true);
    setTimeout(function() { self.increment.call(self) }, 30);
  },

  increment: function() {
    var self = this;
    var val = App.controller.get('progress');
    if(val < 100) {
      App.controller.set('progress', val + 1);
      setTimeout(function() { self.increment.call(self) }, 30);
    }
  }
});

App.ProgressBar = JQ.ProgressBar.extend({
  complete: function() {
    App.set('people', [
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
    App.controller.set('menuDisabled', false);
  }
});

// App.people = [
//   SC.Object.create({
//     name: "Tom DAAAAALE"
//   }),
//   SC.Object.create({
//     name: "Yehuda Katz"
//   }),
//   SC.Object.create({
//     name: "Majd Potatoes"
//   })
// ]

App.MyView = SC.View.extend({
  mouseDown: function() {
    window.alert("hello world!");
  }
});
