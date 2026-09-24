import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function AdminLogin({ onLogin, onVolver }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);

  const entrar = () => {
    const u = usuario.trim().toLowerCase();
    const c = clave.trim().toLowerCase();
    if (u === "admid.2026" && c === "admid.2026") {
      onLogin({ esAdmin: true, user: { email: "admid.2026" } });
    } else {
      Alert.alert("Error", "Usuario o clave incorrecta");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Admin</Text>
        
        <TextInput style={styles.input} placeholder="Usuario" value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} />

        <View style={styles.inputConOjo}>
          <TextInput 
            style={styles.inputOjo} 
            placeholder="Contraseña" 
            value={clave} 
            onChangeText={setClave} 
            secureTextEntry={!verClave}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setVerClave(!verClave)}>
            <Text style={{fontSize: 20}}>{verClave ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.boton} onPress={entrar}>
          <Text style={styles.textoBoton}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onVolver} style={{marginTop:15}}>
          <Text style={{textAlign:"center", color:"#00254E"}}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B8B8B8", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "white", padding: 25, borderRadius: 20 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 12 },
  inputConOjo: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  inputOjo: { flex: 1, paddingVertical: 12 },
  boton: { backgroundColor: "#00254E", padding: 15, borderRadius: 10, alignItems: "center" },
  textoBoton: { color: "white", fontWeight: "bold" },
});