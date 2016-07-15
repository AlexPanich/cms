<!doctype html>
<html lang="ru-RU">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - @yield('title')</title>
    <link rel="stylesheet" href="{{ URL::to('css/dashboard.css') }}">
    @yield('style')
    @yield('style2')
    @yield('scripts.head')
</head>
<body>
    @include('dashboard.top_menu')
    <div class="container">
        @yield('content')
    </div>
    <script src="{{ URL::to('js/dashboard.js') }}"></script>
    @yield('scripts.footer')
    @yield('scripts.footer2')
</body>
</html>