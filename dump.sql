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

--
-- Name: intarray; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS intarray WITH SCHEMA public;


--
-- Name: EXTENSION intarray; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION intarray IS 'functions, operators, and index support for 1-D arrays of integers';


--
-- Name: delete_user_detail(); Type: FUNCTION; Schema: public; Owner: cms
--

CREATE FUNCTION public.delete_user_detail() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
f_col TEXT := TG_ARGV[0];
f_table TEXT := TG_ARGV[1];
should_delete BOOL;
BEGIN
EXECUTE FORMAT(
'(SELECT NOT EXISTS(SELECT 1 FROM orders WHERE %I = %L));',
f_col, OLD.id
) INTO should_delete;
IF should_delete THEN
RETURN  OLD;
ELSE
EXECUTE FORMAT(
'UPDATE %I SET uid = NULL WHERE id = %L',
f_table, OLD.id
);
RETURN  NULL;
END IF;
END;
$$;


ALTER FUNCTION public.delete_user_detail() OWNER TO cms;

--
-- Name: fix_cart_product_qty(); Type: FUNCTION; Schema: public; Owner: cms
--

CREATE FUNCTION public.fix_cart_product_qty() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.qty = LEAST(GREATEST(0, NEW.qty), (
SELECT qty
FROM products
WHERE id = NEW.pid
));
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fix_cart_product_qty() OWNER TO cms;

--
-- Name: prevent_change_submitted(); Type: FUNCTION; Schema: public; Owner: cms
--

CREATE FUNCTION public.prevent_change_submitted() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
RAISE EXCEPTION 'Column ''submitted'' is immutable';
END;
$$;


ALTER FUNCTION public.prevent_change_submitted() OWNER TO cms;

--
-- Name: set_submitted(); Type: FUNCTION; Schema: public; Owner: cms
--

CREATE FUNCTION public.set_submitted() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.submitted = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_submitted() OWNER TO cms;

--
-- Name: update_product_qty(); Type: FUNCTION; Schema: public; Owner: cms
--

CREATE FUNCTION public.update_product_qty() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
UPDATE cart_products
SET qty = LEAST(qty, NEW.qty)
WHERE pid = NEW.id AND NOT EXISTS(
SELECT  1
FROM    orders
WHERE   orders.cid = cart_products.cid
);
RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_product_qty() OWNER TO cms;

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
    uid integer
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
-- Name: orders; Type: TABLE; Schema: public; Owner: cms
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    cid integer NOT NULL,
    address integer NOT NULL,
    shipping_method integer NOT NULL,
    payment_method integer NOT NULL,
    delivered boolean DEFAULT false NOT NULL,
    submitted timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO cms;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: cms
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO cms;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cms
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


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
    CONSTRAINT valid_date CHECK ((date_trunc('month'::text, (expiry)::timestamp with time zone) >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))),
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
    rating smallint NOT NULL,
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
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


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
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


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
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


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
-- Name: images unique_image; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT unique_image UNIQUE (url);


--
-- Name: shipping_methods unique_method; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT unique_method UNIQUE (name);


--
-- Name: orders unique_order; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT unique_order UNIQUE (cid);


--
-- Name: payment_methods unique_payment_method; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT unique_payment_method UNIQUE (uid, card_number, security_code, name, expiry);


--
-- Name: products unique_product; Type: CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT unique_product UNIQUE (name, description);


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
-- Name: cart_products cart_product_qty; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER cart_product_qty BEFORE INSERT OR UPDATE ON public.cart_products FOR EACH ROW EXECUTE FUNCTION public.fix_cart_product_qty();


--
-- Name: addresses delete_address; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER delete_address BEFORE DELETE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.delete_user_detail('address', 'addresses');


--
-- Name: payment_methods delete_payment_method; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER delete_payment_method BEFORE DELETE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.delete_user_detail('payment_method', 'payment_methods');


--
-- Name: orders prevent_change_submitted; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER prevent_change_submitted BEFORE UPDATE OF submitted ON public.orders FOR EACH ROW EXECUTE FUNCTION public.prevent_change_submitted();


--
-- Name: products product_qty; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER product_qty BEFORE UPDATE OF qty ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_product_qty();


--
-- Name: orders set_submitted; Type: TRIGGER; Schema: public; Owner: cms
--

CREATE TRIGGER set_submitted AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_submitted();


--
-- Name: cart_products cart_products_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.cart_products
    ADD CONSTRAINT cart_products_cid_fkey FOREIGN KEY (cid) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: orders fk_address; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_address FOREIGN KEY (address) REFERENCES public.addresses(id);


--
-- Name: orders fk_payment_method; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_payment_method FOREIGN KEY (payment_method) REFERENCES public.payment_methods(id);


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
-- Name: orders fk_shipping_method; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
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
-- Name: images images_pid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pid_fkey FOREIGN KEY (pid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_cid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cid_fkey FOREIGN KEY (cid) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_pid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pid_fkey FOREIGN KEY (pid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shipping shipping_pid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.shipping
    ADD CONSTRAINT shipping_pid_fkey FOREIGN KEY (pid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: tags tags_pid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cms
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pid_fkey FOREIGN KEY (pid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

