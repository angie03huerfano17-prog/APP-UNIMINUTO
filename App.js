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

  // 3. Obtenemos UBICACIÓN REAL en ese momento
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const direccion = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });

  const lugarReal = direccion[0]? `${direccion[0].street || ''} ${direccion[0].city || ''}` : `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
  const fechaReal = new Date().toLocaleString();

  // 4. Guardamos temporal para quemar la marca
  setFotoTemporal({
    uri: resultado.assets[0].uri,
    fecha: fechaReal,
    ubicacion: lugarReal,
    coords: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
    usuario: usuarioActual || 'Usuario Anónimo'
  });

  // Esperamos 500ms a que se renderice el ViewShot oculto y lo capturamos
  setTimeout(async () => {
    try {
      const uriConMarca = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.8,
      });

      // Guardamos en carpeta oculta.evidencias YA CON LA MARCA QUEMADA
      const carpeta = FileSystem.documentDirectory + '.evidencias/';
      const info = await FileSystem.getInfoAsync(carpeta);
      if (!info.exists) await FileSystem.makeDirectoryAsync(carpeta, { intermediates: true });

      const destino = carpeta + `evidencia_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uriConMarca, to: destino });

      const nuevaFoto = {
        uri: destino, // esta ya tiene la marca quemada
        fecha: fechaReal,
        ubicacion: lugarReal,
        usuario: usuarioActual
      };

      setFotosUris([...fotosUris, nuevaFoto]);
      setFotoTemporal(null);
      Alert.alert("Evidencia guardada", `Con marca quemada:\n${lugarReal}\n${fechaReal}\nPor: ${usuarioActual}`);

    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo quemar la marca");
    }
  }, 500);
};

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
        <View style={{ position: 'absolute', bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', width: '100%', padding: 12 }}>
        <Text style={{ color: 'yellow', fontWeight: 'bold', fontSize: 20 }}>Activo: {nombre}</Text>
        <Text style={{ color: 'white', fontSize: 18 }}>Inv: {inventario}</Text>
        <Text style={{ color: 'white', fontSize: 18 }}>Serial: {codigo}</Text>
        <Text style={{ color: 'white', fontSize: 18 }}>Ubic: {ubicacion}</Text>
        {novedades ? <Text style={{ color: 'yellow', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>Nov: {novedades}</Text> : null}
         <Text style={{ color: '#00BFFF', fontSize: 14, marginTop: 6, fontStyle: 'italic' }}>Elaborado por: {auth.currentUser?.email || 'Usuario'}</Text>
        <Text style={{ color: '#00ff00', fontSize: 14, marginTop: 4 }}>{new Date().toLocaleString()}</Text>
       </View>
      </ViewShot>
    )}

  </View>  // <--- ESTE es el que borraste arriba, ahora va acá abajo
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
  textoBoton: { color: 'white', fontWeight: 'bold' },
  botonSalir: { alignItems: 'center', marginTop: 15 },
  textoSalir: { color: '#900', fontWeight: 'bold' },
});