axios.get("/data/credit_customers.csv").then((response) => {
    // Los datos están almacenados en response.data
    const data = Papa.parse(response.data, { header: true }).data;

    // Continuar con el preprocesamiento y el modelado
    preprocessData(data);
})
.catch((err) => {
    console.log("Error", err);
});

function preprocessData(data) {
    // Eliminar la columna "purpose"
    const newData = data.map((d) => {
        delete d.purpose;
        return d;
    });

    // Convertir la columna "checking_status" en variables numéricas
    const statusMap = {
        "no checking": 0,
        "< 0 DM": 1,
        "0 <= ... < 200 DM": 2,
        "... >= 200 DM / salary assignments for at least 1 year": 3,
    };
    newData.forEach((d) => {
        d.checking_status = statusMap[d.checking_status];
    });

    // Continuar con el modelado
    createModel(newData);
}

function createModel(data) {
    // Crear el modelo utilizando la biblioteca ML5.js
    const model = ml5.logisticRegression();

    // Definir las características y etiquetas
    const features = Object.keys(data[0]).filter((key) => key !== "class");
    const labels = "class";

    // Convertir los datos en tensores de TensorFlow
    const tensors = ml5.tensorflow.data.csv("datos.csv", {
        columnConfigs: {
            class: {
                isLabel: true,
            },
        },
    });

    // Dividir los datos en entrenamiento y prueba
    const [trainingData, testingData] = tensors[0].shuffle().split(0.75);

    // Entrenar el modelo
    model.fit(trainingData, features, labels, () => {
        // Evaluar el modelo utilizando el conjunto de datos de prueba
        const predictions = model.predict(testingData);
        const accuracy = ml5.accuracy(predictions, testingData.labels);
        console.log("Precisión:", accuracy);

        // Continuar con las predicciones
        makePredictions(model);
    });
}
