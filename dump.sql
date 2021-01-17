--
-- PostgreSQL database dump
--

-- Dumped from database version 12.5 (Ubuntu 12.5-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.5 (Ubuntu 12.5-0ubuntu0.20.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    uid integer,
    country character varying(255) NOT NULL,
    region character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    address_1 character varying(255) NOT NULL,
    address_2 character varying(150),
    postal_code character varying(15) NOT NULL,
    CONSTRAINT valid_address_1 CHECK (((address_1)::text !~ '([^\w'' ]|_)'::text)),
    CONSTRAINT valid_address_2 CHECK (((address_2)::text !~ '([^\w'' ]|_)'::text)),
    CONSTRAINT valid_city CHECK (((city)::text !~ '[^\w'' ]|\d|_'::text)),
    CONSTRAINT valid_country CHECK (((country)::text !~ '[^\w'' ]|\d|_'::text)),
    CONSTRAINT valid_postal_code CHECK (((address_2)::text !~ '([^-\w'' ]|_)'::text)),
    CONSTRAINT valid_region CHECK (((region)::text !~ '[^\w'' ]|\d|_'::text))
);


ALTER TABLE public.addresses OWNER TO cms;

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.addresses_id_seq OWNER TO cms;

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: cart_products; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.cart_products (
    id integer NOT NULL,
    cid integer,
    pid integer,
    qty integer NOT NULL,
    CONSTRAINT valid_qty CHECK ((qty >= 0))
);


ALTER TABLE public.cart_products OWNER TO cms;

--
-- Name: cart_products_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.cart_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_products_id_seq OWNER TO cms;

--
-- Name: cart_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.cart_products_id_seq OWNED BY public.cart_products.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    uid integer,
    checked_out boolean DEFAULT false
);


ALTER TABLE public.carts OWNER TO cms;

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.carts_id_seq OWNER TO cms;

--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: images; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.images (
    id integer NOT NULL,
    pid integer,
    url character varying(64) NOT NULL,
    alt character varying(64) DEFAULT ''::character varying NOT NULL,
    img_order smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.images OWNER TO cms;

--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.images_id_seq OWNER TO cms;

--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    uid integer,
    card_number bigint NOT NULL,
    security_code smallint NOT NULL,
    name character varying(255) NOT NULL,
    expiry date NOT NULL,
    CONSTRAINT valid_date CHECK (((date_part('month'::text, expiry) >= date_part('month'::text, CURRENT_DATE)) AND (date_part('year'::text, expiry) >= date_part('year'::text, CURRENT_DATE)))),
    CONSTRAINT valid_name CHECK (((name)::text !~ '([^\w'' ]|\d|_)'::text))
);


ALTER TABLE public.payment_methods OWNER TO cms;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_methods_id_seq OWNER TO cms;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: payment_methods_view; Type: VIEW; Schema: public; Owner: cms
--

CREATE VIEW public.payment_methods_view AS
 SELECT payment_methods.id,
    payment_methods.uid,
    "overlay"((payment_methods.card_number)::text, repeat('*'::text, (char_length((payment_methods.card_number)::text) - 4)), 1, (char_length((payment_methods.card_number)::text) - 4)) AS card_number,
    (regexp_matches(rtrim((payment_methods.name)::text, ' '::text), '[^\s]*$'::text))[1] AS name,
    payment_methods.expiry
   FROM public.payment_methods
  ORDER BY payment_methods.id;


ALTER TABLE public.payment_methods_view OWNER TO cms;

--
-- Name: products; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(200),
    information character varying(500),
    price integer NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    qty integer NOT NULL,
    CONSTRAINT valid_discount CHECK (((discount >= 0) AND (price >= discount))),
    CONSTRAINT valid_price CHECK ((price >= 0)),
    CONSTRAINT valid_qty CHECK ((qty >= 0))
);


ALTER TABLE public.products OWNER TO cms;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO cms;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    pid integer,
    uid integer,
    rating integer NOT NULL,
    CONSTRAINT valid_rating CHECK (((rating > 0) AND (rating < 11)))
);


ALTER TABLE public.ratings OWNER TO cms;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ratings_id_seq OWNER TO cms;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: shipping; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.shipping (
    id integer NOT NULL,
    pid integer,
    shipping_method integer NOT NULL
);


ALTER TABLE public.shipping OWNER TO cms;

--
-- Name: shipping_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.shipping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shipping_id_seq OWNER TO cms;

--
-- Name: shipping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.shipping_id_seq OWNED BY public.shipping.id;


--
-- Name: shipping_methods; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.shipping_methods (
    id integer NOT NULL,
    name character varying(32) NOT NULL
);


ALTER TABLE public.shipping_methods OWNER TO cms;

--
-- Name: shipping_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.shipping_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shipping_methods_id_seq OWNER TO cms;

--
-- Name: shipping_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.shipping_methods_id_seq OWNED BY public.shipping_methods.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    pid integer,
    name character varying(32) NOT NULL
);


ALTER TABLE public.tags OWNER TO cms;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tags_id_seq OWNER TO cms;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.users (
    id integer NOT NULL
);


ALTER TABLE public.users OWNER TO cms;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO cms;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: cart_products id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products ALTER COLUMN id SET DEFAULT nextval('public.cart_products_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: shipping id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping ALTER COLUMN id SET DEFAULT nextval('public.shipping_id_seq'::regclass);


--
-- Name: shipping_methods id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping_methods ALTER COLUMN id SET DEFAULT nextval('public.shipping_methods_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.addresses (id, uid, country, region, city, address_1, address_2, postal_code) FROM stdin;
\.


--
-- Data for Name: cart_products; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.cart_products (id, cid, pid, qty) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.carts (id, uid, checked_out) FROM stdin;
1	1	f
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.images (id, pid, url, alt, img_order) FROM stdin;
1	1	imgurl.png	an alt description	1
2	1	anotherimg.png	please add these	0
3	3	test.png	aaaaaaaaaaaa	1
4	3	test2.png		1
5	3	test3.png		1
6	6	test2.png		1
7	2	thisisanimg.png		1
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.payment_methods (id, uid, card_number, security_code, name, expiry) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.products (id, name, description, information, price, discount, qty) FROM stdin;
1	product	a description in the description area	- test markdown\n### that does whatever it likes and stuff\n> 1. bc you **know** how *it* be\n![](/images/test.png)	1999	0	5
2	discountedproduct	some kind of description	\N	600	100	7
3	featuredproduct	a fancy description or something thats kinda long and if i add more it truncates if much more is added to it and after some point it just gets too long for the card to display	\N	3000	0	10
4	featureddiscountedproduct	a short description	\N	4000	1000	3
5	longnameproduct	MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM	\N	2000	301	6
6	anotherlongnameproduct	WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW	\N	500	100	1
7	a free thing	and a description to match	\N	0	0	0
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.ratings (id, pid, uid, rating) FROM stdin;
1	1	1	5
2	1	4	7
3	1	2	2
4	1	3	3
\.


--
-- Data for Name: shipping; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.shipping (id, pid, shipping_method) FROM stdin;
1	1	2
2	1	3
3	2	1
4	2	2
5	2	3
\.


--
-- Data for Name: shipping_methods; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.shipping_methods (id, name) FROM stdin;
1	same-day
2	express
3	standard
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.tags (id, pid, name) FROM stdin;
1	1	tagged
2	1	tags
3	2	tags
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cms
--

COPY public.users (id) FROM stdin;
1
2
3
4
\.


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.addresses_id_seq', 1, false);


--
-- Name: cart_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.cart_products_id_seq', 1, false);


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.carts_id_seq', 1, true);


--
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.images_id_seq', 7, true);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.products_id_seq', 7, true);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.ratings_id_seq', 4, true);


--
-- Name: shipping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.shipping_id_seq', 5, true);


--
-- Name: shipping_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.shipping_methods_id_seq', 3, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.tags_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cms
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: cart_products cart_products_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT cart_products_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- Name: shipping shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: addresses unique_address; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT unique_address UNIQUE (uid, country, region, city, address_1, address_2, postal_code);


--
-- Name: cart_products unique_cart_product; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT unique_cart_product UNIQUE (cid, pid);


--
-- Name: shipping_methods unique_method; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT unique_method UNIQUE (name);


--
-- Name: payment_methods unique_payment_method; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT unique_payment_method UNIQUE (card_number, security_code, name, expiry);


--
-- Name: ratings unique_rating; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT unique_rating UNIQUE (pid, uid);


--
-- Name: shipping unique_shipping_method; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT unique_shipping_method UNIQUE (pid, shipping_method);


--
-- Name: tags unique_tag; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT unique_tag UNIQUE (pid, name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cart_products fk_cid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT fk_cid FOREIGN KEY (cid) REFERENCES public.carts(id);


--
-- Name: images fk_pid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT fk_pid FOREIGN KEY (pid) REFERENCES public.products(id);


--
-- Name: tags fk_pid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT fk_pid FOREIGN KEY (pid) REFERENCES public.products(id);


--
-- Name: shipping fk_pid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT fk_pid FOREIGN KEY (pid) REFERENCES public.products(id);


--
-- Name: ratings fk_pid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT fk_pid FOREIGN KEY (pid) REFERENCES public.products(id);


--
-- Name: cart_products fk_pid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT fk_pid FOREIGN KEY (pid) REFERENCES public.products(id);


--
-- Name: shipping fk_shipping_method; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT fk_shipping_method FOREIGN KEY (shipping_method) REFERENCES public.shipping_methods(id);


--
-- Name: ratings fk_uid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT fk_uid FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- Name: carts fk_uid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT fk_uid FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- Name: addresses fk_uid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT fk_uid FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- Name: payment_methods fk_uid; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT fk_uid FOREIGN KEY (uid) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--
