import { useState, useEffect } from "react";
import {
  Box, VStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, Spinner, useToast, Icon, HStack, IconButton
} from "@chakra-ui/react";
import { FaFileAlt, FaRegCalendarAlt, FaFilePdf, FaClipboardCheck } from "react-icons/fa";
import { useUser } from "./AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { extendTheme } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";

type ExamResult = {
  id: string;
  timestamp: { seconds: number; nanoseconds: number };
  result: {
    questions: Array<{
      questionNumber: string;
      question: string;
      maxMarks: string;
      studentAnswer: string;
      mark: string;
      comment: string;
    }>;
    total: string;
  };
  studentFileName: string;
  schemeFileName: string;
};

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
});

function Dashboard() {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const user = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const FaFileAltIcon = FaFileAlt as any;
  const FaCalendarIcon = FaRegCalendarAlt as any;
  const FaPdfIcon = FaFilePdf as any;
  const FaCheckIcon = FaClipboardCheck as any;

  useEffect(() => {
    if (user !== undefined && user) fetchExams();
  }, [user]);

  const fetchExams = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch("https://ai-examiner-79zf.onrender.com/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      setExams(data);
    } catch {
      setError("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (typeof timestamp?.seconds === "number") {
      const d = new Date(timestamp.seconds * 1000);
      return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const viewExamDetails = (exam: ExamResult) => {
    setSelectedExam(exam);
    onOpen();
  };

  if (user === undefined) {
    return (
      <Box minH="100vh" w="100vw" fontFamily="Inter, sans-serif" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="green.500" thickness="4px" />
      </Box>
    );
  }
  if (user === null) {
    return (
      <Box minH="100vh" w="100vw" fontFamily="Inter, sans-serif" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Heading size="lg">Please log in to view your marked papers</Heading>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box minH="100vh" w="100vw" fontFamily="Inter, sans-serif" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="green.500" thickness="4px" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" w="100vw" fontFamily="Inter, sans-serif" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" px={2} py={0}>
      <IconButton
        icon={<ArrowBackIcon />}
        aria-label="Back"
        position="absolute"
        top={6}
        left={6}
        variant="ghost"
        colorScheme="green"
        size="lg"
        fontSize="2xl"
        onClick={() => navigate("/")}
        zIndex={10}
      />
      <Box w="full" maxW="540px" mt={[8, 16]} mb={8} px={[2, 0]}>
        <Heading fontSize={["2xl", "3xl"]} fontWeight="extrabold" mb={8} color="gray.800" textAlign="left" letterSpacing="tight">
          <Icon as={FaFileAltIcon} boxSize={7} color="green.500" mb={-1} mr={2} />
          Your Marked Papers
        </Heading>
        {error && (
          <VStack spacing={3} mb={6}>
            <Text color="red.500">{error}</Text>
            <Button colorScheme="green" onClick={fetchExams}>Retry</Button>
          </VStack>
        )}
        {loading ? (
          <Box minH="300px" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="green.500" thickness="4px" />
          </Box>
        ) : exams.length === 0 ? (
          <VStack spacing={4} py={16}>
            <Icon as={FaFileAltIcon} boxSize={14} color="gray.300" />
            <Text fontSize="xl" color="gray.600" fontWeight="semibold">No marked papers yet.</Text>
            <Text fontSize="md" color="gray.400">Go back and mark your first paper!</Text>
          </VStack>
        ) : (
          <VStack spacing={6} align="stretch">
            {exams.map((exam) => (
              <Box
                key={exam.id}
                bg="white"
                borderRadius="2xl"
                boxShadow="lg"
                p={[5, 7]}
                display="flex"
                flexDirection="column"
                gap={3}
                _hover={{ boxShadow: "2xl", transform: "translateY(-2px) scale(1.01)" }}
                transition="all 0.18s"
              >
                <HStack spacing={2} color="gray.500" fontSize="sm">
                  <Icon as={FaCalendarIcon} boxSize={4} />
                  <Text>{formatDate(exam.timestamp)}</Text>
                </HStack>
                <HStack spacing={2} color="gray.700" fontWeight="bold">
                  <Icon as={FaPdfIcon} color="green.400" boxSize={5} />
                  <Text fontSize="md">{exam.studentFileName}</Text>
                </HStack>
                <HStack spacing={2} color="gray.700" fontWeight="bold">
                  <Icon as={FaPdfIcon} color="green.400" boxSize={5} />
                  <Text fontSize="md">{exam.schemeFileName}</Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center" mt={2}>
                  <Badge colorScheme="green" px={3} py={1} borderRadius="lg" fontSize="lg" fontWeight="bold" letterSpacing="tight">
                    {exam.result.total}
                  </Badge>
                  <Button
                    size="md"
                    colorScheme="green"
                    borderRadius="xl"
                    fontWeight="semibold"
                    px={6}
                    py={2}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                  >
                    View
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader bg="green.100" color="green.700" fontWeight="bold">
            Breakdown of Results
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody bg="gray.50" px={6} py={4}>
            {selectedExam?.result.questions.map((q, i) => (
              <Box key={i} bg="white" p={4} borderRadius="lg" shadow="md" mb={4}>
                <Text fontWeight="bold" color="green.700">
                  Question {q.questionNumber} <Badge colorScheme="green">{q.mark}/{q.maxMarks}</Badge>
                </Text>
                <Text mt={2} fontSize="sm"><strong>Q:</strong> {q.question}</Text>
                <Text mt={1} fontSize="sm" color="gray.700"><strong>Answer:</strong> {q.studentAnswer}</Text>
                <Text mt={1} fontSize="sm" color="gray.600"><strong>Comment:</strong> {q.comment}</Text>
              </Box>
            ))}
            <Box textAlign="center" mt={4} fontWeight="bold" fontSize="lg" color="green.700">
              Total Score: {selectedExam?.result.total}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
