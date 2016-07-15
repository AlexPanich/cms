@extends('layouts.dashboard');

@section('title')
    Сортировка меню
@endsection

@section('style')
    <style>
        .sorting li {
            cursor: pointer;
        }
    </style>
@endsection

@section('scripts.footer')
    <script src="{{ URL::to('js/jquery-ui.min.js') }}"></script>
    <script>
        $(document).ready(function() {
            $('.sorting').sortable();

            $('.form-sorting input[name=sub]').click(function(e) {
                var pages = [];

                $('.sorting li').each(function() {
                    pages.push($(this).attr('id_page'));
                });

                $('input[name=pages]').val(pages.toString());

                $('.form-sorting').submit();
            });
        });
    </script>
@endsection

@section('content')
    <h1>Сортировка меню</h1>
    <h3>Название меню: {{ $menu->title }}</h3>
    <ul class="sorting">
    @foreach($menu->withPages() as $item)
        <li id_page="{{ $item->id }}">{{ $item->title }}</li>
    @endforeach
    </ul>
    <form class="form-sorting" action="{{ route('sorting_menu', $menu->id) }}" method="post">
        {{ csrf_field() }}
        <input type="hidden" name="pages" value="">
        <input class="btn btn-primary" type="button" name="sub" value="Сортировать">
    </form>
@endsection