<!doctype html>
<html lang="ru_ru">
<head>
    @section('head')
        <meta charset="UTF-8">
        <title>@yield('title')</title>
        <link rel="stylesheet" href="{{ URL::to('css/dashboard.css') }}">
        <meta name="keywords" content="@yield('keywords')">
        <meta name="description" content="@yield('description')">
        @can('edit_from_front')
        <link rel="stylesheet" href="{{ asset('css/jquery-ui.min.css') }}">
        @endcan
    @show
</head>
<body>
    @section('body')
        <script src="{{ URL::to('js/dashboard.js') }}"></script>
    @show
    @can('edit_from_front')
    <script>
        var token = '{{ csrf_token() }}';
    </script>
    <script src="{{ asset('js/jquery-ui.min.js') }}"></script>
    <script src="{{ asset('js/tinymce/tinymce.min.js') }}"></script>
    <script src="{{ asset('js/widget-controls.js') }}"></script>
    <script src="{{ asset('js/widget-replaces.js') }}"></script>
    <script src="{{ asset('js/widget-toggle.js') }}"></script>
    @endcan
</body>
</html>