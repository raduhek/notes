$(document).ready(function(){
  let self = this;
  self.tabId= function() {
    return "tab" + parseInt(Math.random() * 536870912);
  };
  
  self.initNotes = function(chrome) {
    chrome.storage.sync.get(["tabs", "contents"], function(data) {
      // First time opening this page, initialize
      self._data = data;
      if (typeof(data.tabs) === "undefined" || Object.keys(data.tabs).length == 0) {
        newTab = self.tabId();
        var tmp = {
          "tabs": {
            [newTab]: "New tab"
          },
          "content": {
            [newTab]: ""
          }
        };
        chrome.storage.sync.set(data);
        self._data = tmp;
      }
      self.populateDom();
    });
  };
  
  self.uiAddTab = function(id, text) {
    if ($("#" + id).length != 0) return;
    var link = $("<a>").attr("id", id).attr("href", "#d" + id).addClass("usertab black-text").text(text);
    var tab = $("<li>").addClass("tab").append(link);
    $("#tabs").append(tab);
  }

  self.removeTab = function(id) {
    $("#" + id).parent().remove();
    $("#d" + id).remove();
    delete self._data.tabs[id];
    delete self._data.contents["t" + id];
    self.sync(undefined, chrome);
    self.initNotes(chrome);
    M.AutoInit();
  }

  self.uiAddTabContent = function(id) {
    if ($("#d" + id).length != 0) return;
    var content_id = "t" + id;
    var tc = self._data.contents[content_id] || "";
    var ta = $("<textarea>").attr("id", "t" + id).addClass("materialize-textarea usercontent").attr("placeholder", "What's new").attr("tabindex", 1).val(tc);
    var dh = $("<div>").attr("id", "d" + id).addClass("col content-div s12").append(ta);

    $("#tabcontent").append(dh);
    M.textareaAutoResize(ta);
  }

  self.populateDom = function() {
    self._data.contents = self._data.contents || {};
    for (const [id, text] of Object.entries(self._data.tabs)) {
      // Populate tabs
      self.uiAddTab(id, text);
      self.uiAddTabContent(id);
    }
    
    M.AutoInit();
    // Click first tab
    $("#tabs").children(".tab").first().children("a")[0].click();
  };
  
  self.sync = function(target, chrome) {
    if (typeof(target) === "undefined") {
      chrome.storage.sync.set({"tabs": self._data.tabs, "contents": self._data.contents});
      return;
    }
    if (target.localName == "input") {
      // Change tab
      self._data.tabs[target.getAttribute("X-for")] = target.value;
    } else if (target.localName == "textarea") {
      // Change textarea
      self._data.contents[target.id] = target.value;
    }
    chrome.storage.sync.set({"tabs": self._data.tabs, "contents": self._data.contents});
  }

  self.openTabNewModal = function(target_id, text, create) {
    var create = create || "";
    M.Modal.getInstance(document.getElementById("tabnamemodal")).open();
    $("div#tabnamemodal input#tabname").attr("X-For", target_id).attr("create", create).val(text).select();
  }

  self.openRemoveTabModal = function(target_id) {
    M.Modal.getInstance(document.getElementById("removetabmodal")).open();
    $("div#removetabmodal a.apply").attr("X-For", target_id).focus();
  }

  // Handlers
  // Save content while typing
  $(document).on("change", ".usercontent", function (ev) {
    self.sync(ev.target, chrome);
  });

  // Double-click tab to rename
  $(document).on("dblclick", ".usertab", function (ev) {
    self.openTabNewModal(ev.target.id, ev.target.text);
  });

  // Remove modal
  $("div#removetabmodal a.apply").on("click", function (ev) {
    var tid = ev.target.getAttribute("X-for");
    self.removeTab(tid);
  });

  // Add Modal - Apply (or enter)
  $("div#tabnamemodal a.apply").on("click", function (ev) {
    var modal_input = $("div#tabnamemodal input#tabname");
    var tab_id = modal_input.attr("X-for");
    var tab_name = modal_input.val();
    if (!!modal_input.attr("create") === true) {
      console.log("createing " + tab_id);
      self.uiAddTab(tab_id, tab_name);
      self.uiAddTabContent(tab_id);
      $("#" + tab_id)[0].click();
      setTimeout(function () {$("#t" + tab_id).focus()}, 0);
    } else {
      $("#" + tab_id).text(tab_name);
    }
    M.AutoInit();
    self.sync(modal_input[0], chrome);
  });
  $("div#tabnamemodal input#tabname").on("keypress", function (ev) {
    if (ev.charCode == 13) {
      $("div#tabnamemodal a.apply").click();
      M.Modal.getInstance(document.getElementById("tabnamemodal")).close();
    }
  });

  // Float - Add
  $("#add_tab").click(function () {
    var tid = self.tabId();
    console.log("Clicked");
    self.openTabNewModal(tid, "New tab", "yes");
  });

  // Float - Remove
  $("#remove_tab").click(function () {
    var tid = $('a.active')[0].id;
    self.openRemoveTabModal(tid);
  });

  self.initNotes(chrome);
});
