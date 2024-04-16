// import { MatchParser } from "./matchParser";

function onParse() {
    const matchLinksArea = document.getElementById('matchLinksArea');
    const userListArea = document.getElementById('userListArea');
    const mapPoolArea = document.getElementById('mapPoolArea');

    const scoreCheck = document.getElementById('scoreCheck');
    const accCheck = document.getElementById('accCheck');
    const modsCheck = document.getElementById('modsCheck');
    const emptyColumnCheck = document.getElementById('emptyColumnCheck');
    const scoreTypeCheck = document.getElementById('scoreTypeCheck');
    const mapsOutsideOfPoolCheck = document.getElementById('mapsOutsideOfPoolCheck');
    const pathButton = document.getElementById('pathButton');
    const path = pathButton.textContent || pathButton.innerText;
    const pathValue = path === 'Select output directory' ? getPath() : path;
    const settings = [scoreCheck.checked,
        accCheck.checked,
        modsCheck.checked,
        emptyColumnCheck.checked,
        scoreTypeCheck.checked,
        mapsOutsideOfPoolCheck.checked
    ];

    try {
        const result = MatchParser.parseMatch(
            matchLinksArea.value,
            userListArea.value,
            mapPoolArea.value,
            pathValue,
            settings
        );
        alertSuccess(result);
    } catch (error) {
        console.error(error);
    }
}

// function alertSuccess(info: String) {
//     Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
//     alert.setTitle("Yay!");
//     alert.setHeaderText("Parse successful!");
//     alert.setContentText(info);
//     alert.show();
// }
//
// function error(e: Exception) {
//     String error = e.toString();
//     System.out.println(e.getClass().toString());
//     switch (e.getClass().toString()) {
//         case "class java.net.MalformedURLException" -> error += "\nPlease check the match links.";
//     }
//     Alert alert = new Alert(Alert.AlertType.ERROR);
//     alert.setTitle("Oh no!");
//     alert.setHeaderText("Sorry! I could not parse that...");
//     alert.setContentText(error);
//     alert.show();
// }

function help() {
    const helpButton = document.getElementById('helpButton');
    if (helpButton.textContent === 'Sorry') {
        helpButton.textContent = 'Forgive me';
    } else {
        helpButton.textContent = 'Sorry';
    }
}

// function selectPath() {
//     pathButton.setText(getPath());
// }
//
// function getPath() {
//     Stage stage = (Stage) rootPane.getScene().getWindow();
//     DirectoryChooser directoryChooser = new DirectoryChooser();
//     directoryChooser.setTitle("Please select output directory");
//     File selectedDirectory = directoryChooser.showDialog(stage);
//     return selectedDirectory.getAbsolutePath();
// }