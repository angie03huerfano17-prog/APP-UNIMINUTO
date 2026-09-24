import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const DOMINIO = "@uniminuto.edu.co";

export default function LoginScreen({ onLogin, onAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPass, setVerPass] = useState(false);

  const ingresar = async () => {
    try {
      const correo = email.trim().toLowerCase();
      if (!correo || !password) {
        Alert.alert("Falta información", "Ingresa correo y contraseña");
        return;
      }
      if (!correo.endsWith(DOMINIO)) {
        Alert.alert("Acceso denegado", "Solo se permiten correos @uniminuto.edu.co");
        return;
      }
      setCargando(true);
      const { user } = await signInWithEmailAndPassword(auth, correo, password);
      const snap = await getDoc(doc(db, "admins", correo));
      const esAdmin = snap.exists();
      onLogin({ user, esAdmin });
    } catch (e) {
      Alert.alert("Error al ingresar", "Correo o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={{ width: 130, height: 130, backgroundColor: '#00254E', borderRadius: 65, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>UNIMINUTO</Text>
        </View>
        <Text style={styles.titulo}>Registro de Activos</Text>
        <Text style={styles.subtitulo}>Ingresa con tu correo institucional</Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#00254E" />
        ) : (
          <>
            <TextInput
              placeholder="correo@uniminuto.edu.co"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <View style={styles.inputPassContainer}>
              <TextInput
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!verPass}
                style={styles.inputPass}
              />
              <TouchableOpacity onPress={() => setVerPass(!verPass)}>
                <Text style={{fontSize: 20}}>{verPass ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.boton} onPress={ingresar}>
              <Text style={styles.textoBoton}>Ingresar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAdmin} style={{marginTop: 18, alignItems: 'center'}}>
              <Text style={{color: '#00254E', fontWeight: 'bold'}}>Ingresar como administrador</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B8B8B8", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "white", padding: 25, borderRadius: 20 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 15 },
  subtitulo: { fontSize: 14, color: "#555", textAlign: "center", marginTop: 6, marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  inputPassContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff' },
  inputPass: { flex: 1, paddingVertical: 12 },
  boton: { backgroundColor: "#00254E", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 5 },
  textoBoton: { color: "white", fontWeight: "bold", fontSize: 16 },
});