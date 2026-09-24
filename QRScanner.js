import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

export default function QRScanner({ onEscaneado, onCerrar }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Necesitamos permiso de cámara para el QR</Text>
        <Button title="Dar permiso" onPress={requestPermission} />
        <Button title="Volver" onPress={onCerrar} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={({ data }) => {
          if (!escaneado) {
            setEscaneado(true);
            onEscaneado(data);
          }
        }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <TouchableOpacity style={styles.btn} onPress={onCerrar}>
        <Text style={styles.txtBtn}>Cerrar cámara</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#00254E', padding: 15, borderRadius: 10 },
  txtBtn: { color: 'white', fontWeight: 'bold' }
});