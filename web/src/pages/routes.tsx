import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CSSTransition } from "react-transition-group";
import { Inter } from "next/font/google";
import Head from "next/head";
import "animate.css";
import {
    AbsoluteCenter,
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Center,
    CircularProgress,
    Flex,
    FormControl,
    FormLabel,
    Grid,
    GridItem,
    Heading,
    HStack,
    Link,
    NumberInput,
    NumberInputField,
    SimpleGrid,
    Spinner,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";

import dynamic from "next/dynamic";
const MapWithNoSSR = dynamic(() => import("../components/RouteMap"), {
    ssr: false,
});
const RoutePreviewWithNoSSR = dynamic(
    () => import("../components/RoutePreview"),
    {
        ssr: false,
    }
);

const inter = Inter({ subsets: ["latin"] });

const metadata = {
    title: "JogRoute",
    description: "An automatic route planner for joggers.",
};

interface Route {
    route: [number, number][];
    distance: number;
}

const RoutesPage: React.FC = () => {
    // const [routes, setRoutes] = useState<[number, number][][]>([points]);

    // Load routes from the server.
    const [routes, setRoutes] = useState<Route[]>([]);

    const [selectedRoute, setSelectedRoute] = useState<number>(0);
    const [hoveredRoute, setHoveredRoute] = useState<number>(-1);

    const router = useRouter();

    const toast = useToast();

    const distanceFormat = (distance: number) => {
        if (distance < 1) {
            return distance.toFixed(0) + " m";
        } else {
            return (distance / 1000).toFixed(3) + " km";
        }
    };

    useEffect(() => {
        if (!router.isReady) return;

        const { lat, lon, distance } = router.query;
        console.log(lat, lon, distance);
        const eventSource = new EventSource(
            `http://localhost:8080/api/generate?lat=${lat}&lon=${lon}&distance=${distance}`
        );
        eventSource.onopen = () => console.log("Connection opened.");
        eventSource.onerror = () => console.log("Connection error.");
        eventSource.onmessage = (event) => {
            if (event.data === "Connection closed") {
                eventSource.close();
                console.log("Connection closed.");
                return;
            }
            if (event.data === "Timeout") {
                eventSource.close();
                console.log("Connection timed out.");
                toast({
                    title: "Error",
                    description: "The server took too long to respond.",
                    status: "error",
                    duration: 9000,
                    isClosable: true,
                });
                return;
            }

            const data = JSON.parse(event.data) as Route;
            setRoutes((routes) => [...routes, data]);
        };

        return () => {
            eventSource.close();
            console.log("Connection closed.");
        };
    }, [router.isReady]);

    return (
        <div className={inter.className}>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <Heading p="10px" bgGradient="linear(to-r, #20ffff, #4060ff)">
                JogRoute
            </Heading>
            <SimpleGrid p="10px" columns={2} spacing={10}>
                <MapWithNoSSR
                    points={
                        routes.length > 0 ? routes[selectedRoute].route : []
                    }
                />
                <GridItem>
                    {routes.length <= 0 ? (
                        <Center h="100%">
                            <div>
                                <Heading size="md">
                                    Generating routes...
                                </Heading>
                                <br />
                                <Center>
                                    <CircularProgress isIndeterminate />
                                </Center>
                            </div>
                        </Center>
                    ) : (
                        <Box
                            mb="10px"
                            overflow="hidden"
                            overflowY="auto"
                            maxHeight="80vh"
                        >
                            <SimpleGrid columns={2} spacing={6} mr="10px">
                                {routes.map((route, index) => (
                                    // Transition to have the cards slide in from the bottom.
                                    <CSSTransition
                                        key={index}
                                        classNames={{
                                            enterActive:
                                                "animate__animated animate__slideInRight",
                                        }}
                                        timeout={1000}
                                        className="animate__animated animate__slideInRight"
                                    >
                                        <Card
                                            onClick={() =>
                                                setSelectedRoute(index)
                                            }
                                            backgroundColor={
                                                selectedRoute === index
                                                    ? "blue.200"
                                                    : hoveredRoute === index
                                                    ? "gray.100"
                                                    : undefined
                                            }
                                            cursor="pointer"
                                            onMouseEnter={() =>
                                                setHoveredRoute(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredRoute(-1)
                                            }
                                        >
                                            <Grid templateColumns="repeat(2, 1fr)">
                                                <RoutePreviewWithNoSSR
                                                    points={route.route}
                                                    objectFit="cover"
                                                />
                                                <Stack>
                                                    <CardBody>
                                                        <Heading size="md">
                                                            Route {index + 1}
                                                        </Heading>
                                                        <Text>
                                                            {distanceFormat(
                                                                route.distance
                                                            )}{" "}
                                                        </Text>
                                                    </CardBody>
                                                </Stack>
                                            </Grid>
                                        </Card>
                                    </CSSTransition>
                                ))}
                            </SimpleGrid>
                        </Box>
                    )}
                </GridItem>
            </SimpleGrid>

            <Link href="/">
                <Button
                    position="fixed"
                    bottom="10px"
                    right="10px"
                    colorScheme="blue"
                >
                    Back
                </Button>
            </Link>
        </div>
    );
};

export default RoutesPage;
