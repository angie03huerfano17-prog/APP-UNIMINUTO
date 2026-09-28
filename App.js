import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import LoginScreen from './login2';
import AdminLogin from './adminlogin';
import QRScanner from './QRScanner';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from  'expo-file-system/legacy'; 
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import ViewShot from 'react-native-view-shot';
import { captureRef } from 'react-native-view-shot';
import { encode as btoa } from "base-64";
import { loginOneDrive } from "./onedrive";
import * as SecureStore from 'expo-secure-store';
export default function App() {
  const [sesion, setSesion] = useState(null);
  const [vistaAdmin, setVistaAdmin] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [listaFotos, setListaFotos] = useState([])
  const [ubicacion, setUbicacion] = useState('');
  const [verQR, setVerQR] = useState(false);
  const [fotosUris, setFotosUris] = useState([]); 
  const [activos, setActivos] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(''); // Quien toma la foto
  const viewShotRef = useRef();
  const [fotoTemporal, setFotoTemporal] = useState(null); // para quemar la marca
  const [modalVisible, setModalVisible] = useState(false)
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null)
  const [inventario, setInventario] = useState('');
  const [novedades, setNovedades] = useState('');
  const tomarFoto = async () => {
  if (fotosUris.length >= 5) {
    Alert.alert("Limite", "Máximo 5 fotos");
    return;
  }
 
const LINK_CARPETA_ONEDRIVE =
  "https://uniminuto0-my.sharepoint.com/:f:/g/personal/angie_huerfano-l_uniminuto_edu_co/IgBFYlwBCgCnQrV6fv5dpIl4AQsqnZmmTw6RfNS6c0Hex7o?e=CzLzii"
function encodeSharingUrl(url) {
  const base64 = btoa(url).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
  return "u!" + base64;
}

async function resolverCarpetaCompartida(tokenReal) {
  const shareId = encodeSharingUrl(LINK_CARPETA_ONEDRIVE);
  console.log("shareId:", shareId);
  const resp = await fetch(`https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`, {
    headers: { Authorization: `Bearer ${tokenReal}` }
  });
  if (!resp.ok) {
    throw new Error(`No se pudo resolver la carpeta compartida: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return {
    driveId: data.parentReference.driveId,
    itemId: data.id,
  };
}

  // 1. Permiso de cámara
  const permisoCam = await ImagePicker.requestCameraPermissionsAsync();
  if (!permisoCam.granted) { Alert.alert("Necesitas permiso de cámara"); return; }

  // 2. Permiso de UBICACIÓN REAL DEL CELULAR
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status!== 'granted') {
    Alert.alert("Sin GPS", "Necesitas activar la ubicación para la evidencia");
    return;
  }

  const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (resultado.canceled) return;

  /// 3. Obtenemos UBICACIÓN REAL en ese momento
let lugarReal = 'Ubicación no disponible';
try {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  try {
    const direccion = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    lugarReal = direccion[0]? `${direccion[0].street || ''} ${direccion[0].city || ''}` : `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
  } catch (e) {
    console.log('Geocoder falló, uso coordenadas:', e);
    lugarReal = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
  }
  var coordsTexto = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
} catch (e) {
  console.log('No se pudo obtener GPS');
  var coordsTexto = 'Sin GPS';
}
const fechaReal = new Date().toLocaleString();

// 4. Guardamos temporal para quemar la marca
// 4. Guardamos temporal para quemar la marca
setFotoTemporal({
  uri: resultado.assets[0].uri,
  fecha: fechaReal,
  ubicacion: lugarReal,
  coords: typeof coordsTexto!== 'undefined'? coordsTexto : 'Sin GPS',
  usuario: sesion?.user?.email || sesion?.email || usuarioActual?.email || 'Usuario Anónimo',
  nombre: nombre, // Activo
  inventario: inventario,
  codigo: codigo, // Serial
  novedades: novedades,
  sitio: ubicacion,
  correoCorto: (sesion?.user?.email || sesion?.email || usuarioActual?.email || '').split('@')[0] // angie_huerfano-l
});
  // Esperamos 500ms a que se renderice el ViewShot oculto y lo capturamos
  setTimeout(async () => {
  try {
    const uriConMarca = await viewShotRef.current.capture();

    const carpeta = FileSystem.documentDirectory + '.evidencias/';
    const info = await FileSystem.getInfoAsync(carpeta);
    if (!info.exists) await FileSystem.makeDirectoryAsync(carpeta, { intermediates: true });

    const destino = carpeta + `evidencia_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uriConMarca, to: destino });

    // --- SUBIR A TU CARPETA DE ONEDRIVE ---
    try {
      const NOMBRE_CARPETA = "Carpeta de fotos Evidencias-2026";
      const fechaHoy = new Date().toISOString().split('T')[0];
      const correoReal = usuarioActual?.email || usuarioActual || 'Usuario';
      const nombreOneDrive = `${codigo || 'SN'}-${fechaHoy}.jpg`;
      const tokenOneDriveGuardado = await SecureStore.getItemAsync('onedrive_token');
      const tokenReal = usuarioActual?.token || usuarioActual?.accessToken || tokenOneDriveGuardado;
     if (tokenReal) {
      const { driveId, itemId } = await resolverCarpetaCompartida(tokenReal);
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}:/${encodeURIComponent(nombreOneDrive)}:/content`;

      console.log("Subiendo a:", nombreOneDrive);
      await FileSystem.uploadAsync(uploadUrl, uriConMarca, {
        headers: { Authorization: `Bearer ${tokenReal}` },
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      Alert.alert("¡Guardado!", `Foto ${nombreOneDrive} en OneDrive`);
    } else {
      Alert.alert("Sin token", "No has iniciado sesión en OneDrive");
      console.log("tokenReal null");
    }
  } catch (e) {
    console.log("Error OneDrive:", e);
    Alert.alert("Error OneDrive", e.message);
  }

  const correoFinal = usuarioActual?.email || usuarioActual || 'Usuario Anónimo';
    const nuevaFoto = {
      uri: destino,
      fecha: fechaReal,
      ubicacion: lugarReal,
      usuario: correoFinal
    };

    setFotosUris([...fotosUris, nuevaFoto]);
    setFotoTemporal(null);
    Alert.alert("Evidencia guardada", `Con marca: ${lugarReal} - ${correoFinal}`);

  } catch (e) {
    console.log(e);
    Alert.alert("Error", "No se pudo guardar la evidencia");
  }
}, 500);
}
const registrarActivo = () => {
    if (!nombre.trim() ||!codigo.trim() ||!ubicacion.trim()) {
      Alert.alert('Faltan datos', 'Completa el nombre, código y ubicación');
      return;
    }
    setActivos([
     ...activos,
      {
        id: Date.now(),
        nombre,
        codigo,
        ubicacion,
        fotos: fotosUris,
        fecha: new Date().toLocaleString(),
      },
    ]);
    setNombre('');
    setCodigo('');
    setUbicacion('');
    setFotosUris([]);
    Alert.alert('Listo', 'Activo registrado');
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // si falla el cierre en Firebase, igual se sale de la app
    }
    setSesion(null);
  };

    // Si no hay sesión iniciada, se muestra la pantalla de ingreso
  if (!sesion) {
    if (vistaAdmin) {
      return <AdminLogin onLogin={setSesion} onVolver={() => setVistaAdmin(false)} />;
    }
    return <LoginScreen onLogin={setSesion} onAdmin={() => setVistaAdmin(true)} />;
  }
 return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logoMD}>MD</Text>
          <Text style={styles.titulo}>Registro de Activos</Text>
          <Text style={styles.subtitulo}>
            {sesion.user.email}
            {sesion.esAdmin ? ' (Administrador)' : ''}
          </Text>
        </View>

        <View style={styles.formulario}>
          <Text style={styles.label}>Nombre del activo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Portátil HP"
          />
        <Text style={styles.label}>Nombre inventario</Text>
        <TextInput
        style={styles.input}
        value={inventario}
        onChangeText={setInventario}
        placeholder="Ej: INV-2024-001"
      />
       <Text style={styles.label}>Código / Serial</Text>
          <TextInput
            style={styles.input}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Ej: UNIM-001"
          />
          <Text style={styles.label}>Ubicación</Text>
            <TextInput
                style={styles.input}
                value={ubicacion}
                onChangeText={setUbicacion}
                placeholder="Ej: Sala 201"
              />
              <Text style={styles.label}>Novedades</Text>
              <TextInput
              style={[styles.input, { height: 80 }]}
              value={novedades}
              onChangeText={setNovedades}
              placeholder="Ej: Sin novedad, rayado, etc"
              multiline
             
             />
            <TouchableOpacity
                onPress={tomarFoto}
                style={{ backgroundColor: '#555', padding: 12, borderRadius: 8, marginTop: 8 }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                  📁 Tomar Foto del Activo ({fotosUris.length}/5)
                </Text>
                </TouchableOpacity>   
    
             {/* BOTÓN PARA VER LA CARPETA OCULTA */}
  <TouchableOpacity
    style={[styles.boton, { backgroundColor: '#444', marginTop: 10 }]}
    onPress={async () => {
      try {
        const carpeta = FileSystem.documentDirectory + '.evidencias/';
        const lista = await FileSystem.readDirectoryAsync(carpeta);
        if (lista.length === 0) {
          Alert.alert("Carpeta vacía", "Aún no has guardado evidencias");
        } else {
          const rutasCompletas = lista.map(f => carpeta + f);
          setListaFotos(rutasCompletas);
          Alert.alert("Carpeta .evidencias", `Tienes ${lista.length} fotos`);
        }
      } catch (e) {
        Alert.alert("No hay carpeta aún", "Toma al menos 1 foto primero");
      }
    }}
  >
    <Text style={styles.textoBoton}>Ver Carpeta de Evidencias</Text>
  </TouchableOpacity>

   <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 }}>
    {listaFotos.map((uri, i) => (
      <TouchableOpacity key={i} onPress={() => { setFotoSeleccionada(uri); setModalVisible(true) }}>
        <Image source={{ uri: uri }} style={{ width: 100, height: 100, margin: 5, borderRadius: 8 }} />
      </TouchableOpacity>
    ))}
  </View>

  {/* MODAL PARA VER FOTO GRANDE */}
  <Modal visible={modalVisible} transparent={true}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 1 }} onPress={() => setModalVisible(false)}>
        <Text style={{ color: 'white', fontSize: 30 }}>X</Text>
      </TouchableOpacity>
      <Image source={{ uri: fotoSeleccionada }} style={{ width: '90%', height: '70%', borderRadius: 10 }} resizeMode="contain" />
    </View>
  </Modal>
        
              <TouchableOpacity style={styles.boton} onPress={registrarActivo}>
                <Text style={styles.textoBoton}>Registrar Activo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botonSalir} onPress={cerrarSesion}>
                <Text style={styles.textoSalir}>Cerrar Sesión</Text>
              </TouchableOpacity>
                   </View>
    </ScrollView>

    {/* VISTA OCULTA QUE QUEMA LA MARCA */}
{fotoTemporal && (
  <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
    <Image source={{ uri: fotoTemporal.uri }} style={{ width: 800, height: 600 }} />
    <View style={{ position: 'absolute', bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', width: '100%', padding: 10 }}>
      <Text style={{ color: 'yellow', fontWeight: 'bold', fontSize: 20 }}>Activo: {fotoTemporal.nombre || nombre || 'No aplica'}</Text>
      <Text style={{ color: 'white', fontSize: 18 }}>Inv: {fotoTemporal.inventario || inventario || 'No aplica'}</Text>
      <Text style={{ color: 'white', fontSize: 18 }}>Serial: {fotoTemporal.codigo || codigo || 'No aplica'}</Text>
      <Text style={{ color: 'white', fontSize: 18 }}>Ubic: {fotoTemporal.ubicacion || ubicacion || 'No aplica'}</Text>
      <Text style={{ color: 'white', fontSize: 18 }}>sitio:{fotoTemporal.sitio || ubicacion || 'No aplica'}</Text>
        <Text style={{ color: '#4CAF50', fontSize: 16 }}>{new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })}</Text>
      <Text style={{ color: '#4CAF50', fontSize: 16, fontWeight: 'bold' }}>Elab: {fotoTemporal.correoCorto || (usuarioActual?.email || '').split('@')[0]}</Text>
      <Text style={{ color: 'yellow', fontWeight: 'bold', fontSize: 18 }}>Nov: {fotoTemporal.novedades || novedades || 'Sin novedad'}</Text>
      </View>
  </ViewShot>
)}
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B8B8B8' },
  scroll: { padding: 20, paddingTop: 50 },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 15,
  },
  logoMD: { fontSize: 50, fontWeight: 'bold', color: '#FFC000', textAlign: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 4 },
  formulario: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  label: { fontWeight: 'bold', marginTop: 15 },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
  },
  boton: {
    backgroundColor: '#00254E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  botonSalir: { alignItems: 'center', marginTop: 10 },
  textoSalir: { color: 'red', fontSize: 14 },
}); 
