import { useState } from "react";
import { Box, Button, Input, VStack, Text } from "@chakra-ui/react";
import { login, register } from "./authHelpers";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setError("");
      if (isRegister) await register(email, password);
      else await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box p={6} border="1px solid #ddd" borderRadius="md">
      <VStack spacing={4}>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Text color="red.500">{error}</Text>}
        <Button onClick={handleSubmit}>{isRegister ? "Register" : "Login"}</Button>
        <Button variant="link" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "No account? Register"}
        </Button>
      </VStack>
    </Box>
  );
}
