import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  ChakraProvider,
  extendTheme,
  IconButton,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { login, register } from "./authHelpers";

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
});

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
      toast({ title: "Authentication failed", status: "error" });
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        bgImage="url('/background.jpg')"
        bgSize="cover"
        bgPosition="center"
        px={4}
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <IconButton
          icon={<ArrowBackIcon />}
          aria-label="Back"
          position="absolute"
          top={4}
          left={4}
          variant="ghost"
          colorScheme="green"
          onClick={() => (window.location.href = "/")}
        />

        <Box
          p={8}
          borderRadius="xl"
          boxShadow="2xl"
          bg="rgba(255, 255, 255, 0.85)"
          backdropFilter="blur(12px)"
          maxW="400px"
          w="full"
        >
          <Heading size="lg" textAlign="center" mb={2}>
            {mode === "login" ? "Login" : "Sign Up"}
          </Heading>

          <Text fontSize="sm" color="gray.600" textAlign="center" mb={4}>
            {mode === "login"
              ? "Login to access your dashboard and 10 free credits per month."
              : "Create an account to start marking papers with 10 free credits monthly."}
          </Text>

          <VStack spacing={4}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="white"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="white"
            />
            <Button colorScheme="green" onClick={handleSubmit} w="full">
              {mode === "login" ? "Login" : "Create Account"}
            </Button>
            <Button
              variant="link"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              fontSize="sm"
              color="green.600"
            >
              {mode === "login"
                ? "Need an account? Sign up"
                : "Have an account? Login"}
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default AuthPage;
