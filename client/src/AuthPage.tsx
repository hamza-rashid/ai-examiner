import { useState } from "react";
import {
  Box, Button, Input, VStack, Heading, Text, useToast, ChakraProvider
} from "@chakra-ui/react";
import { login, register } from "./authHelpers";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      if (mode === "login") {
        await login(email, password);
        toast({ title: "Logged in", status: "success" });
      } else {
        await register(email, password);
        toast({ title: "Account created", status: "success" });
      }
      window.location.href = "/";
    } catch {
      toast({ title: "Auth failed", status: "error" });
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4}>
        <Box p={8} borderRadius="lg" boxShadow="lg" bg="white" maxW="400px" w="full">
          <Heading size="md" mb={4} textAlign="center">
            {mode === "login" ? "Login" : "Sign Up"}
          </Heading>
          <VStack spacing={4}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button colorScheme="green" onClick={handleSubmit} w="full">
              {mode === "login" ? "Login" : "Create Account"}
            </Button>
            <Button
              variant="link"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              fontSize="sm"
            >
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Login"}
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default AuthPage;
