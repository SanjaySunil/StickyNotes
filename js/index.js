/**
 * Author: Sanjay Sunil (D3VSJ)
 * License: MIT
 */

$(document).ready(function () {
  //initialize the firebase app
  var config = {
    apiKey: "AIzaSyB51V-vQSx89fNJqvPaXyYSRNifhaB4bK0",
    authDomain: "stickynotes-474d9.firebaseapp.com",
    projectId: "stickynotes-474d9",
    storageBucket: "stickynotes-474d9.appspot.com",
    messagingSenderId: "472523983888",
    appId: "1:472523983888:web:b56b514654a96775dc4e95",
    measurementId: "G-P9SVKC7620"
  };
  firebase.initializeApp(config);

  // Firebase References
  var Auth = firebase.auth();
  var dbRef = firebase.database();
  var notesRef = dbRef.ref("notes");
  var usersRef = dbRef.ref("users");
  var auth = null;

  //Register
  $("#registerForm").on("submit", function (e) {
    e.preventDefault();
    var data = {
      email: $("#registerEmail").val(), //get the email from Form
      firstName: $("#registerFirstName").val(), // get firstName
      lastName: $("#registerLastName").val(), // get lastName
    };
    var passwords = {
      password: $("#registerPassword").val(), //get the pass from Form
      cPassword: $("#registerConfirmPassword").val(), //get the confirmPass from Form
    };
    if (
      data.email != "" &&
      passwords.password != "" &&
      passwords.cPassword != ""
    ) {
      if (passwords.password == passwords.cPassword) {
        //create the user
        firebase
          .auth()
          .createUserWithEmailAndPassword(data.email, passwords.password)
          /*
            .then(function (user) {
              return user.updateProfile({
                displayName: data.firstName + ' ' + data.lastName
              })
            })
            */
          .then(function (user) {
            //now user is needed to be logged in to save data
            auth = user;
            //now saving the profile data
            usersRef
              .child(user.uid)
              .set(data)
              .then(function () {
                console.log("User Information Saved:", user.uid);
              });
            console.log("Success");
            window.location.reload();
          })
          .catch(function (error) {
            console.log("Error creating user:", error);
            new Noty({
              type: 'error',
              theme: "nest",
              closeWith: ['button'],
              text: error.message,
              timeout: 5000,
              progressBar: true
            }).show()
          });
      } else {
        //password and confirm password didn't match
        console.log("ERROR: Passwords didn't match");
      }
    }
  });

  //Login
  $("#loginForm").on("submit", function (e) {
    e.preventDefault();

    if ($("#loginEmail").val() != "" && $("#loginPassword").val() != "") {
      //login the user
      var data = {
        email: $("#loginEmail").val(),
        password: $("#loginPassword").val(),
      };
      firebase
        .auth()
        .signInWithEmailAndPassword(data.email, data.password)
        .then(function (authData) {
          auth = authData;
          window.location.reload();
        })
        .catch(function (error) {
          console.log("Login Failed!");
          console.log(error.message)
          new Noty({
            type: 'error',
            theme: "nest",
            closeWith: ['button'],
            text: error.message,
            timeout: 5000,
            progressBar: true
          }).show()
        });
    }
  });

  $("#logout").on("click", function (e) {
    e.preventDefault();
    console.log("Successfully logged out.")
    firebase.auth().signOut();
  });

  //save createNote
  $("#createNote").on("submit", function (event) {
    event.preventDefault();
    if (auth != null) {
      if ($("#name").val() != "" || $("#email").val() != "") {
        let current_datetime = new Date()
        let formatted_date = current_datetime.getDate() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getFullYear() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
        notesRef.child(auth.uid).push({
          name: $("#name").val(),
          value: $("#value").val(),
          timestamp: formatted_date
          /*
          spec: {
            date: $("#date").val(),
            time: $("#time").val()
          },
          */
        });
        new Noty({
          type: 'success',
          theme: "nest",
          closeWith: ['button'],
          text: "Sticky Note Added!",
          timeout: 5000,
          progressBar: true
        }).show()
        document.createNote.reset();
        $('#createNoteModal').modal('hide')
      } else {
        new Noty({
          type: 'success',
          theme: "nest",
          closeWith: ['button'],
          text: "Please fill at least a title or description!",
          timeout: 5000,
          progressBar: true
        }).show()
      }
    } else {
      //inform user to login
    }
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is logged in
      console.log("User is logged in:")
      auth = user;
      $("body").removeClass("auth-false").addClass("auth-true");
      usersRef
        .child(user.uid)
        .once("value")
        .then(function (data) {
          var info = data.val();
          if (user.photoUrl) {
            $(".user-info img").show();
            $(".user-info img").attr("src", user.photoUrl);
            $(".user-info .user-name").hide();
          } else if (user.displayName) {
            $(".user-info img").hide();
            $(".user-info").append(
              '<span class="user-name">' + user.displayName + "</span>"
            );
            console.log("Welcome, " + user.displayName + "!");
            new Noty({
              type: 'success',
              theme: "nest",
              closeWith: ['button'],
              text: "Welcome, " + user.displayName + "!",
              timeout: 5000,
              progressBar: true
            }).show()
          } else if (info.firstName) {
            $(".user-info img").hide();
            $(".user-info").append(
              '<span class="user-name"> Hello, ' + info.firstName + "!</span>"
            );
            console.log("Welcome, " + info.firstName + "!");
            new Noty({
              type: 'success',
              theme: "nest",
              closeWith: ['button'],
              text: "Welcome, " + info.firstName + "!",
              timeout: 5000,
              progressBar: true
            }).show()
          }
        });
      notesRef.child(user.uid).on("child_added", onChildAdd);
    } else {
      // No user is signed in.
      $("body").removeClass("auth-true").addClass("auth-false");
      auth && notesRef.child(auth.uid).off("child_added", onChildAdd);
      $("#notes").html("");
      auth = null;
      //$("#loginForm").modal('show')
      console.log("No user is logged in.")
    }
  });
});

function onChildAdd(snap) {
  $("#notes").append(noteFormObject(snap.key, snap.val()));
}

//prepare createNote object's HTML
function noteFormObject(key, notes) {
  const fireNote = "StickyNote"

  return (
    '<div class="card text-white bg-secondary mb-3" style="min-width: 18rem; max-width: 18rem;">' +
    '<div class="card-header">' +
    fireNote +
    "</div>" +
    '<div class="card-body">' +
    '<h5 class="card-title">' +
    notes.name +
    "</h5>" +
    '<p class="card-text">' +
    notes.value +
    '</p>' +
    "</div>" +
    '<div class="card-footer">' +
    '<small>' +
    "Edited at: " + notes.timestamp +
    '</small>' +
    '</div>' +
    "</div>"
  );
}

function spanText(textStr, textClasses) {
  var classNames = textClasses.map((c) => "text-" + c).join(" ");
  return '<span class="' + classNames + '">' + textStr + "</span>";
}

function errorNotification() {
  new Noty({
    type: 'error',
    theme: "nest",
    closeWith: ['button'],
    text: error.message,
    timeout: 5000,
    progressBar: true
  }).show()
}


