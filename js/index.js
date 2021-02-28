/**
 * @file index.js
 * @author Sanjay Sunil
 * @license MIT
 */

$(document).ready(function () {
  // Firebase References
  var Auth = firebase.auth();
  var dbRef = firebase.database();
  var notesRef = dbRef.ref("notes");
  var usersRef = dbRef.ref("users");
  var auth = null;

  // Register
  $("#registerForm").on("submit", function (e) {
    e.preventDefault();
    var data = {
      email: $("#registerEmail").val(),
      firstName: $("#registerFirstName").val(),
      lastName: $("#registerLastName").val(),
    };
    var passwords = {
      password: $("#registerPassword").val(),
      cPassword: $("#registerConfirmPassword").val(),
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
          .then(function (user) {

            auth = user;

            usersRef
              .child(user.uid)
              .set(data)
              .then(function () {
                console.log("User Information Saved: ", user.uid);
              });
            window.location.reload();
          })
          .catch(function (error) {
            console.log("ERROR: ", error);
            errorNotification(error.message)
          });
      } else {
        //password and confirm password didn't match
        console.log("ERROR: Passwords didn't match");
      }
    }
  });

  // Login
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
          errorNotification(error.message)
        });
    }
  });

  // Logout 
  $("#logout").on("click", function (e) {
    e.preventDefault();
    console.log("Successfully logged out.")
    firebase.auth().signOut();
  });

  // Create Note
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
        successNotification("Sticky Note Added!")
        document.createNote.reset();
        $('#createNoteModal').modal('hide')
      } else {
        errorNotification("Please fill a title or description!")
      }
    } else {
      console.log("You must be logged in!")
    }
  });

  // Firebase Auth State
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is logged in
      console.log("User is logged in.")
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
            successNotification("Welcome, " + user.displayName + "!")
          } else if (info.firstName) {
            $(".user-info img").hide();
            $(".user-info").append(
              '<span class="user-name"> Hello, ' + info.firstName + "!</span>"
            );
            console.log("Welcome, " + info.firstName + "!");
            successNotification("Welcome, " + info.firstName + "!")
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

// Build Note
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
    "Created At: " + notes.timestamp +
    '</small>' +
    '</div>' +
    "</div>"
  );
}


