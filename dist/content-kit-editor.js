/*!
 * @overview ContentKit-Editor: A modern, minimalist WYSIWYG editor.
 * @version  0.1.0
 * @author   Garth Poitras <garth22@gmail.com> (http://garthpoitras.com/)
 * @license  MIT
 * Last modified: Jul 10, 2014
 */

(function(exports, document) {

'use strict';

/**
 * @namespace ContentKit
 */
var ContentKit = exports.ContentKit || {};
exports.ContentKit = ContentKit;

var Keycodes = {
  ENTER : 13,
  ESC   : 27
};

var Regex = {
  NEWLINE       : /[\r\n]/g,
  HTTP_PROTOCOL : /^https?:\/\//i,
  HEADING_TAG   : /^(h1|h2|h3|h4|h5|h6)$/i,
  UL_START      : /^[-*]\s/,
  OL_START      : /^1\.\s/
};

var SelectionDirection = {
  LEFT_TO_RIGHT : 0,
  RIGHT_TO_LEFT : 1,
  SAME_NODE     : 2
};

var Tags = {
  LINK         : 'a',
  PARAGRAPH    : 'p',
  HEADING      : 'h2',
  SUBHEADING   : 'h3',
  QUOTE        : 'blockquote',
  LIST         : 'ul',
  ORDERED_LIST : 'ol',
  LIST_ITEM    : 'li'
};

var RootTags = [ Tags.PARAGRAPH, Tags.HEADING, Tags.SUBHEADING, Tags.QUOTE, Tags.LIST, Tags.ORDERED_LIST, 'div'];

function getNodeTagName(node) {
  return node.tagName && node.tagName.toLowerCase() || null;
}

function getDirectionOfSelection(selection) {
  var position = selection.anchorNode.compareDocumentPosition(selection.focusNode);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    return SelectionDirection.LEFT_TO_RIGHT;
  } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
    return SelectionDirection.RIGHT_TO_LEFT;
  }
  return SelectionDirection.SAME_NODE;
}

function getCurrentSelectionNode() {
  var selection = window.getSelection();
  var node = getDirectionOfSelection(selection) === SelectionDirection.LEFT_TO_RIGHT ? selection.anchorNode : selection.focusNode;
  return node && (node.nodeType === 3 ? node.parentNode : node);
}

function getCurrentSelectionRootNode() {
  var node = getCurrentSelectionNode(),
      tag = getNodeTagName(node);
  while (tag && RootTags.indexOf(tag) === -1) {
    node = node.parentNode;
    tag = getNodeTagName(node);
  }
  return node;
}

function getCurrentSelectionTag() {
  return getNodeTagName(getCurrentSelectionNode());
}

function getCurrentSelectionRootTag() {
  return getNodeTagName(getCurrentSelectionRootNode());
}

function getElementOffset(element) {
  var offset = { left: 0, top: 0 };
  var elementStyle = window.getComputedStyle(element);

  if (elementStyle.position === 'relative') {
    offset.left = parseInt(elementStyle['margin-left'], 10);
    offset.top  = parseInt(elementStyle['margin-top'], 10);
  }
  return offset;
}

function createDiv(className) {
  var div = document.createElement('div');
  if (className) {
    div.className = className;
  }
  return div;
}

function extend(object, updates) {
  updates = updates || {};
  for(var o in updates) {
    if (updates.hasOwnProperty(o)) {
      object[o] = updates[o];
    }
  }
  return object;
}

function applyConstructorProperties(instance, props) {
  for(var p in props) {
    if (props.hasOwnProperty(p)) {
      instance[p] = props[p];
    }
  }
}

function inherits(Subclass, Superclass) {
  Subclass._super = Superclass;
  Subclass.prototype = Object.create(Superclass.prototype, {
    constructor: {
      value: Subclass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

function moveCursorToBeginningOfSelection(selection) {
  var range = document.createRange(),
      node  = selection.anchorNode;
  range.setStart(node, 0);
  range.setEnd(node, 0);
  selection.removeAllRanges();
  selection.addRange(range);
}

function restoreRange(range) {
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function selectNode(node) {
  var range = document.createRange(),
      selection = window.getSelection();
  range.setStart(node, 0);
  range.setEnd(node, node.length);
  selection.removeAllRanges();
  selection.addRange(range);
}

var Prompt = (function() {

  var container = document.body;
  var hiliter = createDiv('ck-editor-hilite');

  function Prompt(options) {
    if (options) {
      var prompt = this;
      var element = document.createElement('input');
      this.placeholder = options.placeholder;
      this.command = options.command;
      this.element = element;
      element.type = 'text';
      element.placeholder = this.placeholder;
      element.addEventListener('mouseup', function(e) { e.stopPropagation(); }); // prevents closing prompt when clicking input 
      element.addEventListener('keyup', function(e) {
        var entry = this.value;
        if(entry && !e.shiftKey && e.which === Keycodes.ENTER) {
          restoreRange(prompt.range);
          prompt.command.exec(entry);
          if (prompt.onComplete) { prompt.onComplete(); }
        }
      });
    }
  }

  Prompt.prototype = {
    display: function(callback) {
      this.range = window.getSelection().getRangeAt(0); // save the selection range
      hiliteRange(this.range);
      this.clear();
      var element = this.element;
      setTimeout(function(){ element.focus(); }); // defer focus (disrupts mouseup events)
      if (callback) { this.onComplete = callback; }
    },
    dismiss: function() {
      this.clear();
      unhiliteRange();
    },
    clear: function() {
      this.element.value = null;
    }
  };

  function hiliteRange(range) {
    var rangeBounds = range.getBoundingClientRect();
    var hiliterStyle = hiliter.style;
    var offset = getElementOffset(container);

    hiliterStyle.width  = rangeBounds.width + 'px';
    hiliterStyle.height = rangeBounds.height + 'px';
    hiliterStyle.left   = rangeBounds.left - offset.left + 'px';
    hiliterStyle.top    = rangeBounds.top + window.pageYOffset - offset.top + 'px';
    container.appendChild(hiliter);
  }

  function unhiliteRange() {
    container.removeChild(hiliter);
  }

  return Prompt;
}());

function Command(options) {
  if(options) {
    var name = options.name;
    var prompt = options.prompt;
    this.name = name;
    this.tag = options.tag;
    this.action = options.action || name;
    this.removeAction = options.removeAction || options.action;
    this.button = options.button || name;
    if (prompt) { this.prompt = prompt; }
  }
}
Command.prototype.exec = function(value) {
  document.execCommand(this.action, false, value || null);
};
Command.prototype.unexec = function(value) {
  document.execCommand(this.removeAction, false, value || null);
};

function BoldCommand() {
  Command.call(this, {
    name: 'bold',
    tag: 'b',
    button: '<i class="ck-icon-bold"></i>'
  });
}
inherits(BoldCommand, Command);
BoldCommand.prototype.exec = function() {
  // Don't allow executing bold command on heading tags
  if (!Regex.HEADING_TAG.test(getCurrentSelectionRootTag())) {
    BoldCommand._super.prototype.exec.call(this);
  }
};

function ItalicCommand() {
  Command.call(this, {
    name: 'italic',
    tag: 'i',
    button: '<i class="ck-icon-italic"></i>'
  });
}
inherits(ItalicCommand, Command);

function LinkCommand() {
  Command.call(this, {
    name: 'link',
    tag: Tags.LINK,
    action: 'createLink',
    removeAction: 'unlink',
    button: '<i class="ck-icon-link"></i>',
    prompt: new Prompt({
      command: this,
      placeholder: 'Enter a url, press return...'
    })
  });
}
inherits(LinkCommand, Command);
LinkCommand.prototype.exec = function(url) {
  if(this.tag === getCurrentSelectionTag()) {
    this.unexec();
  } else {
    if (!Regex.HTTP_PROTOCOL.test(url)) {
      url = 'http://' + url;
    }
    LinkCommand._super.prototype.exec.call(this, url);
  }
};

function FormatBlockCommand(options) {
  options.action = 'formatBlock';
  Command.call(this, options);
}
inherits(FormatBlockCommand, Command);
FormatBlockCommand.prototype.exec = function() {
  var tag = this.tag;
  // Brackets neccessary for certain browsers
  var value =  '<' + tag + '>';
  // Allow block commands to be toggled back to a paragraph
  if(tag === getCurrentSelectionRootTag()) {
    value = Tags.PARAGRAPH;
  } else {
    // Flattens the selection before applying the block format.
    // Otherwise, undesirable nested blocks can occur.
    var root = getCurrentSelectionRootNode();
    var flatNode = document.createTextNode(root.textContent);
    root.parentNode.insertBefore(flatNode, root);
    root.parentNode.removeChild(root);
    selectNode(flatNode);
  }
  
  FormatBlockCommand._super.prototype.exec.call(this, value);
};

function QuoteCommand() {
  FormatBlockCommand.call(this, {
    name: 'quote',
    tag: Tags.QUOTE,
    button: '<i class="ck-icon-quote"></i>'
  });
}
inherits(QuoteCommand, FormatBlockCommand);

function HeadingCommand() {
  FormatBlockCommand.call(this, {
    name: 'heading',
    tag: Tags.HEADING,
    button: '<i class="ck-icon-heading"></i>1'
  });
}
inherits(HeadingCommand, FormatBlockCommand);

function SubheadingCommand() {
  FormatBlockCommand.call(this, {
    name: 'subheading',
    tag: Tags.SUBHEADING,
    button: '<i class="ck-icon-heading"></i>2'
  });
}
inherits(SubheadingCommand, FormatBlockCommand);

function ListCommand(options) {
  Command.call(this, options);
}
inherits(ListCommand, Command);
ListCommand.prototype.exec = function() {
  ListCommand._super.prototype.exec.call(this);
  
  // After creation, lists need to be unwrapped from the default formatter P tag
  var listNode = getCurrentSelectionRootNode();
  var wrapperNode = listNode.parentNode;
  if (wrapperNode.firstChild === listNode) {
    var editorNode = wrapperNode.parentNode;
    editorNode.insertBefore(listNode, wrapperNode);
    editorNode.removeChild(wrapperNode);
    selectNode(listNode);
  }
};

function UnorderedListCommand() {
  ListCommand.call(this, {
    name: 'list',
    tag: Tags.LIST,
    action: 'insertUnorderedList',
    button: '<i class="ck-icon-list"></i>'
  });
}
inherits(UnorderedListCommand, ListCommand);

function OrderedListCommand() {
  ListCommand.call(this, {
    name: 'ordered list',
    tag: Tags.ORDERED_LIST,
    action: 'insertOrderedList',
    button: '<i class="ck-icon-list-ordered"></i>'
  });
}
inherits(OrderedListCommand, ListCommand);

Command.all = [
  new BoldCommand(),
  new ItalicCommand(),
  new LinkCommand(),
  new QuoteCommand(),
  new HeadingCommand(),
  new SubheadingCommand()
];

Command.index = (function() {
  var index = {},
      commands = Command.all,
      len = commands.length, i, command;
  for(i = 0; i < len; i++) {
    command = commands[i];
    index[command.name] = command;
  }
  return index;
})();

ContentKit.Editor = (function() {

  // Default `Editor` options
  var defaults = {
    defaultFormatter: Tags.PARAGRAPH,
    placeholder: 'Write here...',
    spellcheck: true,
    autofocus: true,
    commands: Command.all
  };

  var editorClassName = 'ck-editor',
      editorClassNameRegExp = new RegExp(editorClassName);

  /**
   * Publically expose this class which sets up indiviual `Editor` classes
   * depending if user passes string selector, Node, or NodeList
   */
  function EditorFactory(element, options) {
    var editors = [],
        elements, elementsLen, i;

    if (typeof element === 'string') {
      elements = document.querySelectorAll(element);
    } else if (element && element.length) {
      elements = element;
    } else if (element) {
      elements = [element];
    }

    if (elements) {
      options = extend(defaults, options);
      elementsLen = elements.length;
      for (i = 0; i < elementsLen; i++) {
        editors.push(new Editor(elements[i], options));
      }
    }

    return editors.length > 1 ? editors : editors[0];
  }

  /**
   * @class Editor
   * An individual Editor
   * @param element `Element` node
   * @param options hash of options
   */
  function Editor(element, options) {
    applyConstructorProperties(this, options);

    if (element) {
      var className = element.className;
      var dataset = element.dataset;

      if (!editorClassNameRegExp.test(className)) {
        className += (className ? ' ' : '') + editorClassName;
      }
      element.className = className;

      if (!dataset.placeholder) {
        dataset.placeholder = this.placeholder;
      }

      if(!this.spellcheck) {
        element.spellcheck = false;
      }

      this.element = element;
      this.toolbar = new Toolbar({ commands: this.commands });

      bindTextSelectionEvents(this);
      bindTypingEvents(this);
      bindPasteEvents(this);

      this.enable();
      if(this.autofocus) {
        element.focus();
      }
    }
  }

  Editor.prototype = {
    enable: function() {
      var editor = this,
          element = editor.element;
      if(element && !editor.enabled) {
        element.setAttribute('contentEditable', true);
        editor.enabled = true;
      }
    },
    disable: function() {
      var editor = this,
          element = editor.element;
      if(element && editor.enabled) {
        element.removeAttribute('contentEditable');
        editor.enabled = false;
      }
    },
    parse: function() {
      var editor = this;
      if (!editor.parser) {
        if (!ContentKit.HTMLParser) {
          throw new Error('Include the ContentKit compiler for parsing');
        }
        editor.parser = new ContentKit.HTMLParser();
      }
      return editor.parser.parse(editor.element.innerHTML);
    }
  };

  function bindTextSelectionEvents(editor) {
    // Mouse text selection
    document.addEventListener('mouseup', function(e) {
      setTimeout(function(){ handleTextSelection(e, editor); });
    });

    // Keyboard text selection
    editor.element.addEventListener('keyup', function(e) {
      handleTextSelection(e, editor);
    });
  }

  function bindTypingEvents(editor) {
    var editorEl = editor.element;

    // Breaks out of blockquotes when pressing enter.
    editorEl.addEventListener('keyup', function(e) {
      if(!e.shiftKey && e.which === Keycodes.ENTER) {
        if(Tags.QUOTE === getCurrentSelectionRootTag()) {
          document.execCommand('formatBlock', false, editor.defaultFormatter);
          e.stopPropagation();
        }
      }
    });

    // Creates unordered list when block starts with '- ', or ordered if starts with '1. '
    editorEl.addEventListener('keyup', function(e) {
      var selectedText = window.getSelection().anchorNode.textContent,
          selection, selectionNode, command, replaceRegex;

      if (Tags.LIST_ITEM !== getCurrentSelectionTag()) {
        if (Regex.UL_START.test(selectedText)) {
          command = new UnorderedListCommand();
          replaceRegex = Regex.UL_START;
        } else if (Regex.OL_START.test(selectedText)) {
          command = new OrderedListCommand();
          replaceRegex = Regex.OL_START;
        }

        if (command) {
          command.exec();
          selection = window.getSelection();
          selectionNode = selection.anchorNode;
          selectionNode.textContent = selectedText.replace(replaceRegex, '');
          moveCursorToBeginningOfSelection(selection);
          e.stopPropagation();
        }
      }
    });

    // Assure there is always a paragraph and not divs
    editorEl.addEventListener('keyup', function() {
      var node = getCurrentSelectionRootNode();
      // TODO: support root <article> or other block element
      if(getNodeTagName(node) === 'div' && node.innerHTML !== '') {
        document.execCommand('formatBlock', false, editor.defaultFormatter);
      }
    });
  }

  function handleTextSelection(e, editor) {
    var selection = window.getSelection();
    if (!selection.isCollapsed && selectionIsInElement(editor.element, selection)) {
      editor.toolbar.updateForSelection(selection);
    } else {
      editor.toolbar.hide();
    }
  }

  function selectionIsInElement(element, selection) {
    var node = selection.focusNode,
        parentNode = node.parentNode;
    while(parentNode) {
      if (parentNode === element) {
        return true;
      }
      parentNode = parentNode.parentNode;
    }
    return false;
  }

  function bindPasteEvents(editor) {
    editor.element.addEventListener('paste', function(e) {
      var data = e.clipboardData, plainText;
      e.preventDefault();
      if(data && data.getData) {
        plainText = data.getData('text/plain');
        var formattedContent = plainTextToBlocks(plainText, editor.defaultFormatter);
        document.execCommand('insertHTML', false, formattedContent);
      }
    });
  }

  function plainTextToBlocks(plainText, blockTag) {
    var blocks = plainText.split(Regex.NEWLINE),
        len = blocks.length,
        block, openTag, closeTag, content, i;
    if(len < 2) {
      return plainText;
    } else {
      content = '';
      openTag = '<' + blockTag + '>';
      closeTag = '</' + blockTag + '>';
      for(i=0; i<len; ++i) {
        block = blocks[i];
        if(block !== '') {
          content += openTag + block + closeTag;
        }
      }
      return content;
    }
  }

  return EditorFactory;
}());

var Toolbar = (function() {

  var container = document.body,
      buttonContainerElement, promptContainerElement;

  function Toolbar(options) {
    var commands = options && options.commands,
        commandCount = commands && commands.length,
        i, button;
    this.element = createDiv('ck-toolbar');
    this.isShowing = false;
    this.activePrompt = null;
    this.buttons = [];
    promptContainerElement = createDiv('ck-toolbar-prompt');
    this.element.appendChild(promptContainerElement);
    buttonContainerElement = createDiv('ck-toolbar-buttons');
    this.element.appendChild(buttonContainerElement);
    for(i = 0; i < commandCount; i++) {
      button = new ToolbarButton({ command: commands[i], toolbar: this });
      buttonContainerElement.appendChild(button.element);
      this.buttons.push(button);
    }
    bindEvents(this);
  }

  Toolbar.prototype = {
    show: function() {
      if(!this.isShowing) {
        container.appendChild(this.element);
        this.isShowing = true;
      }
    },
    hide: function() {
      if(this.isShowing) {
        container.removeChild(this.element);
        this.dismissPrompt();
        this.isShowing = false;
      }
    },
    displayPrompt: function(prompt) {
      var toolbar = this;
      buttonContainerElement.style.display = 'none';
      promptContainerElement.style.display = 'block';
      promptContainerElement.appendChild(prompt.element);
      prompt.display(function() {
        toolbar.dismissPrompt();
        toolbar.updateForSelection(window.getSelection());
      });
      this.activePrompt = prompt;
    },
    dismissPrompt: function() {
      if (this.activePrompt) {
        promptContainerElement.style.display = 'none';
        promptContainerElement.innerHTML = '';
        buttonContainerElement.style.display = 'block';
        this.activePrompt.dismiss();
        this.activePrompt = null;
      }
    },
    updateForSelection: function(selection) {
      this.show();
      this.positionToSelection(selection);
      updateButtonsForSelection(this.buttons, selection);
    },
    positionToSelection: function(selection) {
      if (!selection.isCollapsed) {
        var clientRectBounds = selection.getRangeAt(0).getBoundingClientRect();
        this.setPosition(
          (clientRectBounds.left + clientRectBounds.right) / 2,
          clientRectBounds.top + window.pageYOffset
        );
      }
    },
    setPosition: function(x, y) {
      var element = this.element,
          style = element.style,
          offset = getElementOffset(container);

      style.left = parseInt(x - (element.offsetWidth / 2) - offset.left, 10) + 'px';
      style.top  = parseInt(y - element.offsetHeight - offset.top, 10) + 'px';
    }
  };

  function bindEvents(toolbar) {
    document.addEventListener('keyup', function(e) {
      if (e.keyCode === Keycodes.ESC) {
        toolbar.hide();
      }
    });

    document.addEventListener('mouseup', function() {
      toolbar.dismissPrompt();
    });

    window.addEventListener('resize', function() {
      if(toolbar.isShowing) {
        toolbar.positionToSelection(window.getSelection());
      }
    });
  }

  function updateButtonsForSelection(buttons, selection) {
    var selectedTags = tagsInSelection(selection),
        len = buttons.length,
        i, button;
    for (i = 0; i < len; i++) {
      button = buttons[i];
      if (selectedTags.indexOf(button.command.tag) > -1) {
        button.setActive();
      } else {
        button.setInactive();
      }
    }
  }

  function tagsInSelection(selection) {
    var node = selection.focusNode.parentNode,
        tags = [];

    if (!selection.isCollapsed) {
      while(node) {
        // Stop traversing up dom when hitting an editor element
        if (node.contentEditable === 'true') { break; }
        if (node.tagName) {
          tags.push(node.tagName.toLowerCase());
        }
        node = node.parentNode;
      }
    }
    return tags;
  }

  return Toolbar;
}());

var ToolbarButton = (function() {

  var buttonClassName = 'ck-toolbar-btn';

  function ToolbarButton(options) {
    var toolbar = options.toolbar,
        command = options.command,
        prompt = command.prompt,
        element = document.createElement('button'),
        button = this;

    if(typeof command === 'string') {
      command = Command.index[command];
    }

    element.title = command.name;
    element.className = buttonClassName;
    element.innerHTML = command.button;
    element.addEventListener('click', function() {
      if (!button.isActive && prompt) {
        toolbar.displayPrompt(prompt);
      } else {
        command.exec();
      }
    });
    this.element = element;
    this.command = command;
    this.isActive = false;
  }

  ToolbarButton.prototype = {
    setActive: function() {
      if (!this.isActive) {
        this.element.className = buttonClassName + ' active';
        this.isActive = true;
      }
    },
    setInactive: function() {
      if (this.isActive) {
        this.element.className = buttonClassName;
        this.isActive = false;
      }
    }
  };

  return ToolbarButton;
}());

}(this, document));