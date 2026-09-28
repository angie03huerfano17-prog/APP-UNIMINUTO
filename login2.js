import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import { loginOneDrive } from './onedrive';

const DOMINIO = "@uniminuto.edu.co";

export default function LoginScreen({ onLogin, onAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  const ingresar = () => {
    const correo = email.trim().toLowerCase();
    if (!correo || !password.trim()) {
      Alert.alert("Falta", "Escribe correo y contraseña");
      return;
    }
    if (!correo.endsWith(DOMINIO)) {
      Alert.alert("No permitido", `Solo ${DOMINIO}`);
      return;
    }
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      onLogin({ user: { email: correo }, esAdmin: false });
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCirculo}>
          <Text style={styles.logoTexto}>MD</Text>
        </View>
        <Text style={styles.logoSub}>UNIMINUTO</Text>
      </View>

      <Text style={styles.titulo}>Registro de Activos</Text>

      <TextInput style={styles.input} placeholder="correo@uniminuto.edu.co" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <View style={styles.inputConOjo}>
        <TextInput style={styles.inputFlex} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={!mostrarPass} />
        <TouchableOpacity onPress={() => setMostrarPass(!mostrarPass)}>
          <Text style={{ color: "#0055A5", fontWeight: "bold" }}>{mostrarPass ? "Ocultar" : "Ver"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.boton} onPress={ingresar}>
        {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBoton}>Ingresar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onAdmin} style={{ marginTop: 20 }}>
        <Text style={{ textAlign: "center", color: "#0055A5" }}>Ingresar como administrador</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logoCirculo: { backgroundColor: "#0055A5", width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center" },
  logoTexto: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  logoSub: { marginTop: 8, color: "#0055A5", fontWeight: "bold", letterSpacing: 2 },
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 12, marginBottom: 15 },
  inputConOjo: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 12, paddingHorizontal: 12, marginBottom: 15 },
  inputFlex: { flex: 1, paddingVertical: 12 },
  boton: { backgroundColor: "#0B4F9C", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  textoBoton: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});